import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';

const screenshots = [
  {
    src: '/screenshots/ss1%20Zip%20to%20File.png',
    title: 'Download the ZIP',
    description: 'Click the download button to save the extension ZIP file to your computer.',
  },
  {
    src: '/screenshots/ss2%20Setting%20pannel%20Extension.png',
    title: 'Open Chrome Extensions',
    description: 'Open the Chrome extensions page by navigating to chrome://extensions or using the menu.',
  },
  {
    src: '/screenshots/ss3%20toggle%20Developer.png',
    title: 'Enable Developer mode',
    description: 'Toggle Developer mode on the extensions page so you can load unpacked extensions.',
  },
  {
    src: '/screenshots/ss4%20Load%20and%20Unpack.png',
    title: 'Click Load unpacked',
    description: 'Use the Load unpacked button to select the extension folder from the extracted ZIP.',
  },
  {
    src: '/screenshots/ss5%20Uplaod%20from%20File.png',
    title: 'Select the extension folder',
    description: 'Browse to the extracted extension folder and select it so Chrome can install it.',
  },
  {
    src: '/screenshots/ss6%20conf%20installation.png',
    title: 'Confirm the install',
    description: 'Confirm the extension is installed successfully and enabled in Chrome.',
  },
  {
    src: '/screenshots/ss7%20Button%20will%20apper%20Green%20Button.png',
    title: 'Button appears when available',
    description: 'When a solution link is found, the Get Solution button turns green and is clickable.',
  },
  {
    src: '/screenshots/ss8%20Button%20will%20apper%20Gray%20Button.png',
    title: 'Button remains disabled if unavailable',
    description: 'If no solution is found yet, the button stays gray and visible as an indicator.',
  },
];

const ExtensionInstall: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <p className="text-sm text-brand-600 uppercase tracking-[0.24em] font-semibold">Extension</p>
              <h1 className="text-3xl font-semibold text-gray-900">Install Our Extension</h1>
            </div>
          </div>
          <a
            href="/nb-getsolution.zip"
            download
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition"
          >
            <Download className="w-5 h-5" />
            Download Extension
          </a>
        </div>

        <div className="rounded-3xl bg-white shadow-lg p-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-center">
            <div className="space-y-4">
              <p className="text-sm text-brand-600 font-semibold">Quick install</p>
              <h2 className="text-2xl font-semibold text-gray-900">Set up the NST Buddy extension in minutes</h2>
              <p className="text-gray-600 leading-7">
                Download the extension ZIP, open the Chrome extensions page, enable Developer mode, and load the unpacked extension.
                This page contains the full step-by-step installation guide with screenshots.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">Step 1</p>
                  <p className="text-sm text-gray-600">Download the extension package.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">Step 2</p>
                  <p className="text-sm text-gray-600">Install it in Chrome using Load unpacked.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-300">NST Buddy Extension</p>
              <h3 className="mt-4 text-2xl font-semibold">Get smart solutions faster</h3>
              <p className="mt-3 text-sm text-slate-300 leading-6">
                Use the extension while browsing NewtonSchool to quickly jump to the best matching solution link for the current question.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-slate-950/90 p-4 border border-slate-700">
                  <p className="text-sm text-slate-300">Extension ZIP</p>
                  <p className="text-lg font-semibold text-white">nb-getsolution.zip</p>
                </div>
                <div className="rounded-2xl bg-slate-950/90 p-4 border border-slate-700">
                  <p className="text-sm text-slate-300">Browser</p>
                  <p className="text-lg font-semibold text-white">Chrome / Edge</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-600 uppercase tracking-[0.24em] font-semibold">Installation Guide</p>
              <h2 className="text-2xl font-semibold text-gray-900">Step-by-step instructions</h2>
            </div>
            <a
              href="/nb-getsolution.zip"
              download
              className="inline-flex items-center gap-2 border border-green-600 text-green-600 font-semibold px-4 py-2 rounded-full hover:bg-green-50 transition"
            >
              <Download className="w-4 h-4" />
              Download ZIP again
            </a>
          </div>

          <div className="grid gap-6">
            {screenshots.map((item, index) => (
              <div key={item.src} className="grid gap-4 lg:grid-cols-[1fr_360px] items-center bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Step {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-gray-600 leading-7">{item.description}</p>
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <ArrowRight className="w-4 h-4" />
                      Keep the extension page open after installation.
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950/5 p-4 flex items-center justify-center min-h-[260px]">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="max-h-72 w-full object-contain rounded-2xl border border-gray-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ExtensionInstall;
