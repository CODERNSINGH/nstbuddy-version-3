import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth.js';
import { auth } from '../config/firebase.js';
import { IMAGEKIT_URL_ENDPOINT } from '../config/imagekit.js';

const router = express.Router();
const prisma = new PrismaClient();

const MIN_CAPACITY = 2;
const MAX_CAPACITY = 100;
const CONTACT_METHODS = ['phone', 'whatsapp', 'email'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s-]{7,15}$/;

const authorSelect = { select: { name: true, email: true, picture: true } };

// Only accept a banner URL that actually came from our ImageKit account
const sanitizeBannerUrl = (url) => (typeof url === 'string' && url.startsWith(IMAGEKIT_URL_ENDPOINT) ? url : null);

// Verifies the token if one is present but never fails the request - lets the
// browse/detail views show "is this mine" / "am I a member" for logged-in visitors.
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const user = await prisma.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
        if (user) req.user = { email: user.email, userId: user.id, isAdmin: user.isAdmin };
        next();
    } catch (error) {
        next();
    }
};

const validateContact = (contactMethod, contactValue) => {
    if (!CONTACT_METHODS.includes(contactMethod)) return 'Choose a valid contact method';
    const value = (contactValue || '').trim();
    if (!value) return 'Contact info is required';
    if (value.length > 100) return 'Contact info is too long';
    if (contactMethod === 'email' && !EMAIL_RE.test(value)) return 'Enter a valid email address';
    if ((contactMethod === 'phone' || contactMethod === 'whatsapp') && !PHONE_RE.test(value)) {
        return 'Enter a valid phone number';
    }
    return null;
};

// viewer is the optional req.user object ({ email, isAdmin }) - undefined for anonymous visitors
const formatGroupSummary = (group, viewer) => {
    const viewerEmail = viewer?.email;
    const isMine = viewerEmail ? group.creatorEmail === viewerEmail : false;
    const memberCount = group._count?.members ?? 0;
    return {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        bannerUrl: group.bannerUrl,
        capacity: group.capacity,
        memberCount,
        isFull: memberCount >= group.capacity,
        isActive: group.isActive,
        creator: group.creator,
        isMine,
        canModerate: isMine || Boolean(viewer?.isAdmin),
        isMember: viewerEmail ? (group.members?.length ?? 0) > 0 : false,
        createdAt: group.createdAt,
    };
};

const formatGroupDetail = (group, viewer) => {
    const viewerEmail = viewer?.email;
    const isMine = Boolean(viewerEmail && viewerEmail === group.creatorEmail);
    const members = group.members.map((m) => ({
        id: m.id,
        name: m.member.name,
        email: m.member.email,
        picture: m.member.picture,
        role: m.role,
        joinedAt: m.joinedAt,
        contact: isMine || viewerEmail === m.memberEmail ? { method: m.contactMethod, value: m.contactValue } : null,
    }));

    return {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        bannerUrl: group.bannerUrl,
        capacity: group.capacity,
        memberCount: members.length,
        isFull: members.length >= group.capacity,
        isActive: group.isActive,
        creator: group.creator,
        isMine,
        canModerate: isMine || Boolean(viewer?.isAdmin),
        isMember: viewerEmail ? members.some((m) => m.email === viewerEmail) : false,
        members,
        createdAt: group.createdAt,
    };
};

// GET /api/groups - browse, optionally filtered by ?search=, ?category=
router.get('/', optionalAuth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 30, 100);
        const viewerEmail = req.user?.email;
        const search = req.query.search ? String(req.query.search).trim() : undefined;
        const category = req.query.category ? String(req.query.category).trim() : undefined;

        const where = {
            ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
            ...(category ? { category } : {}),
        };

        const groups = await prisma.group.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                creator: authorSelect,
                _count: { select: { members: true } },
                members: viewerEmail ? { where: { memberEmail: viewerEmail }, select: { id: true } } : false,
            },
        });

        res.json({ success: true, groups: groups.map((g) => formatGroupSummary(g, req.user)) });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch groups' });
    }
});

// GET /api/groups/my - groups I created and groups I've joined
router.get('/my', authenticateUser, async (req, res) => {
    try {
        const email = req.user.email;
        const groups = await prisma.group.findMany({
            where: { OR: [{ creatorEmail: email }, { members: { some: { memberEmail: email } } }] },
            orderBy: { createdAt: 'desc' },
            include: {
                creator: authorSelect,
                _count: { select: { members: true } },
                members: { where: { memberEmail: email }, select: { id: true } },
            },
        });

        res.json({ success: true, groups: groups.map((g) => formatGroupSummary(g, req.user)) });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch your groups' });
    }
});

// GET /api/groups/:id - full detail incl. member list (contact info scoped to admin/self)
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: {
                creator: authorSelect,
                members: { orderBy: { joinedAt: 'asc' }, include: { member: authorSelect } },
            },
        });

        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, group: formatGroupDetail(group, req.user) });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch group' });
    }
});

// POST /api/groups - create a group; creator is auto-added as the first (admin) member
router.post('/', authenticateUser, async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const description = (req.body.description || '').trim();
        const category = req.body.category ? String(req.body.category).trim().slice(0, 40) : null;
        const bannerUrl = sanitizeBannerUrl(req.body.bannerUrl);
        const capacity = parseInt(req.body.capacity);
        const { contactMethod, contactValue } = req.body;

        if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });
        if (name.length > 80) return res.status(400).json({ success: false, error: 'Group name is too long (max 80 characters)' });
        if (!description) return res.status(400).json({ success: false, error: 'Group description is required' });
        if (description.length > 1000) return res.status(400).json({ success: false, error: 'Description is too long (max 1000 characters)' });
        if (!Number.isInteger(capacity) || capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) {
            return res.status(400).json({ success: false, error: `Capacity must be between ${MIN_CAPACITY} and ${MAX_CAPACITY}` });
        }
        const contactError = validateContact(contactMethod, contactValue);
        if (contactError) return res.status(400).json({ success: false, error: contactError });

        const group = await prisma.$transaction(async (tx) => {
            const created = await tx.group.create({
                data: { name, description, category, bannerUrl, capacity, creatorEmail: req.user.email },
            });
            await tx.groupMember.create({
                data: {
                    groupId: created.id,
                    memberEmail: req.user.email,
                    contactMethod,
                    contactValue: contactValue.trim(),
                    role: 'admin',
                },
            });
            return tx.group.findUnique({
                where: { id: created.id },
                include: { creator: authorSelect, members: { include: { member: authorSelect } } },
            });
        });

        res.status(201).json({ success: true, group: formatGroupDetail(group, req.user) });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ success: false, error: 'Failed to create group' });
    }
});

// PUT /api/groups/:id - creator-only edit
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const existing = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { members: true } } },
        });
        if (!existing) return res.status(404).json({ success: false, error: 'Group not found' });
        if (existing.creatorEmail !== req.user.email) {
            return res.status(403).json({ success: false, error: 'Only the group admin can edit this group' });
        }

        const name = (req.body.name || '').trim();
        const description = (req.body.description || '').trim();
        const category = req.body.category ? String(req.body.category).trim().slice(0, 40) : null;
        const bannerUrl = req.body.bannerUrl === null ? null : sanitizeBannerUrl(req.body.bannerUrl) || existing.bannerUrl;
        const capacity = parseInt(req.body.capacity);
        const isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : existing.isActive;

        if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });
        if (!description) return res.status(400).json({ success: false, error: 'Group description is required' });
        if (!Number.isInteger(capacity) || capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) {
            return res.status(400).json({ success: false, error: `Capacity must be between ${MIN_CAPACITY} and ${MAX_CAPACITY}` });
        }
        if (capacity < existing._count.members) {
            return res.status(400).json({ success: false, error: `Capacity can't be lower than the current ${existing._count.members} members` });
        }

        const group = await prisma.group.update({
            where: { id: req.params.id },
            data: { name, description, category, bannerUrl, capacity, isActive },
            include: { creator: authorSelect, members: { include: { member: authorSelect } } },
        });

        res.json({ success: true, group: formatGroupDetail(group, req.user) });
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ success: false, error: 'Failed to update group' });
    }
});

// DELETE /api/groups/:id - creator-only, cascades members
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const existing = await prisma.group.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ success: false, error: 'Group not found' });
        if (existing.creatorEmail !== req.user.email && !req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Only the group admin can delete this group' });
        }

        await prisma.group.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete group' });
    }
});

// POST /api/groups/:id/join - join, sharing contact info for this group
router.post('/:id/join', authenticateUser, async (req, res) => {
    try {
        const { contactMethod, contactValue } = req.body;
        const contactError = validateContact(contactMethod, contactValue);
        if (contactError) return res.status(400).json({ success: false, error: contactError });

        const group = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { members: true } } },
        });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        if (!group.isActive) return res.status(400).json({ success: false, error: 'This group is closed to new members' });
        if (group._count.members >= group.capacity) return res.status(400).json({ success: false, error: 'This group is full' });

        const existingMember = await prisma.groupMember.findUnique({
            where: { groupId_memberEmail: { groupId: req.params.id, memberEmail: req.user.email } },
        });
        if (existingMember) return res.status(400).json({ success: false, error: 'You are already in this group' });

        await prisma.groupMember.create({
            data: {
                groupId: req.params.id,
                memberEmail: req.user.email,
                contactMethod,
                contactValue: contactValue.trim(),
                role: 'member',
            },
        });

        const updated = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: { creator: authorSelect, members: { orderBy: { joinedAt: 'asc' }, include: { member: authorSelect } } },
        });

        res.json({ success: true, group: formatGroupDetail(updated, req.user) });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, error: 'You are already in this group' });
        }
        console.error('Join group error:', error);
        res.status(500).json({ success: false, error: 'Failed to join group' });
    }
});

// POST /api/groups/:id/leave - a member leaves voluntarily (the admin must delete the group instead)
router.post('/:id/leave', authenticateUser, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({ where: { id: req.params.id } });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        if (group.creatorEmail === req.user.email) {
            return res.status(400).json({ success: false, error: 'As the admin, delete the group instead of leaving it' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: { groupId_memberEmail: { groupId: req.params.id, memberEmail: req.user.email } },
        });
        if (!membership) return res.status(404).json({ success: false, error: 'You are not a member of this group' });

        await prisma.groupMember.delete({ where: { id: membership.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ success: false, error: 'Failed to leave group' });
    }
});

// DELETE /api/groups/:id/members/:memberId - admin removes a member
router.delete('/:id/members/:memberId', authenticateUser, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({ where: { id: req.params.id } });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        if (group.creatorEmail !== req.user.email) {
            return res.status(403).json({ success: false, error: 'Only the group admin can remove members' });
        }

        const membership = await prisma.groupMember.findUnique({ where: { id: req.params.memberId } });
        if (!membership || membership.groupId !== req.params.id) {
            return res.status(404).json({ success: false, error: 'Member not found in this group' });
        }
        if (membership.role === 'admin') {
            return res.status(400).json({ success: false, error: "The admin can't be removed - delete the group instead" });
        }

        await prisma.groupMember.delete({ where: { id: membership.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
});

export default router;
