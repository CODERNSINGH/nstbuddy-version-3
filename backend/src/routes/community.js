import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth.js';
import { auth } from '../config/firebase.js';
import { IMAGEKIT_URL_ENDPOINT } from '../config/imagekit.js';

const router = express.Router();
const prisma = new PrismaClient();
const MAX_IMAGES = 5;

// Only accept image URLs that actually came from our ImageKit account -
// guards against the images field being used to hotlink/store arbitrary URLs.
const sanitizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
        .filter((url) => typeof url === 'string' && url.startsWith(IMAGEKIT_URL_ENDPOINT))
        .slice(0, MAX_IMAGES);
};

const authorSelect = { select: { name: true, email: true, picture: true } };
const postWithHashtags = {
    author: authorSelect,
    _count: { select: { likes: true, comments: true } },
    hashtags: { include: { hashtag: true } },
};

// Verifies the token if one is present but never fails the request - used so
// the feed can include "did I like this" / "is this mine" for logged-in
// visitors while still being readable without a token.
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const user = await prisma.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
        if (user) req.user = { email: user.email, userId: user.id, isAdmin: user.isAdmin, isBanned: user.isBanned };
        next();
    } catch (error) {
        next();
    }
};

const extractHashtags = (content) => {
    const matches = content.match(/#([a-zA-Z0-9_]{1,50})/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
};

// Links a post to the given tags, creating/incrementing Hashtag rows as needed
const attachHashtags = async (tx, postId, tags) => {
    for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
            where: { tag },
            update: { postCount: { increment: 1 } },
            create: { tag, postCount: 1 },
        });
        await tx.postHashtag.create({ data: { postId, hashtagId: hashtag.id } });
    }
};

// Unlinks all hashtags from a post, decrementing (and cleaning up empty) Hashtag rows
const detachHashtags = async (tx, postId) => {
    const links = await tx.postHashtag.findMany({ where: { postId }, select: { hashtagId: true } });
    await tx.postHashtag.deleteMany({ where: { postId } });
    for (const link of links) {
        const hashtag = await tx.hashtag.update({
            where: { id: link.hashtagId },
            data: { postCount: { decrement: 1 } },
        });
        if (hashtag.postCount <= 0) {
            await tx.hashtag.delete({ where: { id: hashtag.id } }).catch(() => {});
        }
    }
};

// viewer is the optional req.user object ({ email, isAdmin }) - undefined for anonymous visitors
const formatPost = (post, viewer) => {
    const viewerEmail = viewer?.email;
    const isMine = viewerEmail ? post.authorEmail === viewerEmail : false;
    return {
        id: post.id,
        content: post.content,
        images: post.images || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        hashtags: (post.hashtags || []).map((h) => h.hashtag.tag),
        likeCount: post._count?.likes ?? 0,
        commentCount: post._count?.comments ?? 0,
        likedByMe: viewerEmail ? (post.likes?.length ?? 0) > 0 : false,
        isMine,
        canModerate: isMine || Boolean(viewer?.isAdmin),
    };
};

// GET /api/community/posts - feed, optionally filtered by ?hashtag=, ?author=, ?search=, sorted by ?sort=new|top
router.get('/posts', optionalAuth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 30, 100);
        const viewerEmail = req.user?.email;
        const hashtag = req.query.hashtag ? String(req.query.hashtag).toLowerCase().replace(/^#/, '') : undefined;
        const author = req.query.author ? String(req.query.author).toLowerCase() : undefined;
        const search = req.query.search ? String(req.query.search).trim() : undefined;
        const sort = req.query.sort === 'top' ? 'top' : 'new';

        const where = {
            ...(hashtag ? { hashtags: { some: { hashtag: { tag: hashtag } } } } : {}),
            ...(author ? { authorEmail: author } : {}),
            ...(search ? { content: { contains: search, mode: 'insensitive' } } : {}),
        };

        const posts = await prisma.post.findMany({
            where,
            orderBy: sort === 'top' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : { createdAt: 'desc' },
            take: limit,
            include: {
                ...postWithHashtags,
                likes: viewerEmail ? { where: { userEmail: viewerEmail }, select: { id: true } } : false,
            },
        });

        res.json({ success: true, posts: posts.map((p) => formatPost(p, req.user)) });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch posts' });
    }
});

// GET /api/community/posts/:id - single post, e.g. for a shared link
router.get('/posts/:id', optionalAuth, async (req, res) => {
    try {
        const viewerEmail = req.user?.email;
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                ...postWithHashtags,
                likes: viewerEmail ? { where: { userEmail: viewerEmail }, select: { id: true } } : false,
            },
        });

        if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
        res.json({ success: true, post: formatPost(post, req.user) });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch post' });
    }
});

// GET /api/community/people/search?q= - find people who have posted, by name/email
router.get('/people/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (q.length < 2) return res.json({ success: true, people: [] });

        const limit = Math.min(parseInt(req.query.limit) || 8, 20);
        const users = await prisma.user.findMany({
            where: {
                posts: { some: {} },
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: { name: true, email: true, picture: true, _count: { select: { posts: true } } },
            take: limit,
        });

        res.json({
            success: true,
            people: users.map((u) => ({ name: u.name, email: u.email, picture: u.picture, postCount: u._count.posts })),
        });
    } catch (error) {
        console.error('Search people error:', error);
        res.status(500).json({ success: false, error: 'Failed to search people' });
    }
});

// GET /api/community/hashtags/trending - top hashtags by post count
router.get('/hashtags/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 25);
        const hashtags = await prisma.hashtag.findMany({
            where: { postCount: { gt: 0 } },
            orderBy: { postCount: 'desc' },
            take: limit,
        });

        res.json({ success: true, hashtags: hashtags.map((h) => ({ tag: h.tag, postCount: h.postCount })) });
    } catch (error) {
        console.error('Get trending hashtags error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trending hashtags' });
    }
});

// GET /api/community/my-activity - my post/like/comment counts + recent activity feed
router.get('/my-activity', authenticateUser, async (req, res) => {
    try {
        const email = req.user.email;

        const [postCount, likeCount, commentCount, recentLikes, recentComments] = await Promise.all([
            prisma.post.count({ where: { authorEmail: email } }),
            prisma.like.count({ where: { userEmail: email } }),
            prisma.comment.count({ where: { authorEmail: email } }),
            prisma.like.findMany({
                where: { userEmail: email },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { post: { include: { author: authorSelect } } },
            }),
            prisma.comment.findMany({
                where: { authorEmail: email },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { post: { include: { author: authorSelect } } },
            }),
        ]);

        const recent = [
            ...recentLikes.filter((l) => l.post).map((l) => ({
                type: 'like',
                createdAt: l.createdAt,
                postId: l.postId,
                postAuthor: l.post.author.name,
                snippet: l.post.content.slice(0, 90),
            })),
            ...recentComments.filter((c) => c.post).map((c) => ({
                type: 'comment',
                createdAt: c.createdAt,
                postId: c.postId,
                postAuthor: c.post.author.name,
                snippet: c.content.slice(0, 90),
            })),
        ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6);

        res.json({ success: true, activity: { postCount, likeCount, commentCount, recent } });
    } catch (error) {
        console.error('Get my activity error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch activity' });
    }
});

// POST /api/community/posts - create a post (text, images, or both)
router.post('/posts', authenticateUser, async (req, res) => {
    try {
        if (req.user.isBanned) {
            return res.status(403).json({ success: false, error: 'Your account has been restricted from posting.' });
        }

        const content = (req.body.content || '').trim();
        const images = sanitizeImages(req.body.images);
        if (!content && images.length === 0) {
            return res.status(400).json({ success: false, error: 'Post needs text or at least one image' });
        }
        if (content.length > 2000) return res.status(400).json({ success: false, error: 'Post is too long (max 2000 characters)' });

        const tags = extractHashtags(content);
        const post = await prisma.$transaction(async (tx) => {
            const created = await tx.post.create({ data: { content, images, authorEmail: req.user.email } });
            await attachHashtags(tx, created.id, tags);
            return tx.post.findUnique({ where: { id: created.id }, include: postWithHashtags });
        });

        res.status(201).json({ success: true, post: formatPost(post, req.user) });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ success: false, error: 'Failed to create post' });
    }
});

// PUT /api/community/posts/:id - edit own post
router.put('/posts/:id', authenticateUser, async (req, res) => {
    try {
        const content = (req.body.content || '').trim();
        const images = sanitizeImages(req.body.images);
        if (!content && images.length === 0) {
            return res.status(400).json({ success: false, error: 'Post needs text or at least one image' });
        }
        if (content.length > 2000) return res.status(400).json({ success: false, error: 'Post is too long (max 2000 characters)' });

        const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Post not found' });
        if (existing.authorEmail !== req.user.email && !req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'You can only edit your own posts' });
        }

        const tags = extractHashtags(content);
        const post = await prisma.$transaction(async (tx) => {
            await tx.post.update({ where: { id: req.params.id }, data: { content, images } });
            await detachHashtags(tx, req.params.id);
            await attachHashtags(tx, req.params.id, tags);
            return tx.post.findUnique({
                where: { id: req.params.id },
                include: {
                    ...postWithHashtags,
                    likes: { where: { userEmail: req.user.email }, select: { id: true } },
                },
            });
        });

        res.json({ success: true, post: formatPost(post, req.user) });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ success: false, error: 'Failed to update post' });
    }
});

// DELETE /api/community/posts/:id - delete own post
router.delete('/posts/:id', authenticateUser, async (req, res) => {
    try {
        const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Post not found' });
        if (existing.authorEmail !== req.user.email && !req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'You can only delete your own posts' });
        }

        await prisma.$transaction(async (tx) => {
            await detachHashtags(tx, req.params.id);
            await tx.post.delete({ where: { id: req.params.id } });
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete post' });
    }
});

// POST /api/community/posts/:id/like - toggle like
router.post('/posts/:id/like', authenticateUser, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

        const existing = await prisma.like.findUnique({
            where: { userEmail_postId: { userEmail: req.user.email, postId } },
        });

        if (existing) {
            await prisma.like.delete({ where: { id: existing.id } });
        } else {
            await prisma.like.create({ data: { userEmail: req.user.email, postId } });
        }

        const likeCount = await prisma.like.count({ where: { postId } });
        res.json({ success: true, liked: !existing, likeCount });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle like' });
    }
});

// GET /api/community/posts/:id/comments - list comments, oldest first
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { postId: req.params.id },
            orderBy: { createdAt: 'asc' },
            include: { author: authorSelect },
        });

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch comments' });
    }
});

// POST /api/community/posts/:id/comments - add a comment
router.post('/posts/:id/comments', authenticateUser, async (req, res) => {
    try {
        if (req.user.isBanned) {
            return res.status(403).json({ success: false, error: 'Your account has been restricted from posting.' });
        }

        const content = (req.body.content || '').trim();
        if (!content) return res.status(400).json({ success: false, error: 'Comment content is required' });
        if (content.length > 1000) return res.status(400).json({ success: false, error: 'Comment is too long (max 1000 characters)' });

        const post = await prisma.post.findUnique({ where: { id: req.params.id } });
        if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

        const comment = await prisma.comment.create({
            data: { content, authorEmail: req.user.email, postId: req.params.id },
            include: { author: authorSelect },
        });

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
});

// PUT /api/community/comments/:id - edit own comment
router.put('/comments/:id', authenticateUser, async (req, res) => {
    try {
        const content = (req.body.content || '').trim();
        if (!content) return res.status(400).json({ success: false, error: 'Comment content is required' });
        if (content.length > 1000) return res.status(400).json({ success: false, error: 'Comment is too long (max 1000 characters)' });

        const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Comment not found' });
        if (existing.authorEmail !== req.user.email) return res.status(403).json({ success: false, error: 'You can only edit your own comments' });

        const comment = await prisma.comment.update({
            where: { id: req.params.id },
            data: { content },
            include: { author: authorSelect },
        });

        res.json({ success: true, comment });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ success: false, error: 'Failed to update comment' });
    }
});

// DELETE /api/community/comments/:id - delete own comment
router.delete('/comments/:id', authenticateUser, async (req, res) => {
    try {
        const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Comment not found' });
        if (existing.authorEmail !== req.user.email && !req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'You can only delete your own comments' });
        }

        await prisma.comment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete comment' });
    }
});

export default router;
