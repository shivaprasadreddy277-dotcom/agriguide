import React from "react";
import { Link } from "react-router-dom";
import { Sprout, Microscope, Droplet, ShieldCheck, HelpCircle, FileImage, ShieldAlert, ArrowRight } from "lucide-react";

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">AgriGuide Assistance Guide</h2>
        <p className="text-sm text-slate-500">Learn how to query the AI to receive clear, precise recommendations.</p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl inline-block">
            <Sprout className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Soil & Water inputs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Specify technical parameters like soil pH, recent rainfall descriptions, and NPK measurements. Better context yields highly tailored water schedules.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl inline-block">
            <FileImage className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Visual Closeups</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ensure leaf anomaly pictures are sharp, well-lit, and focus directly on lesion markings. Close-ups help identify pest signatures.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl inline-block">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Safety Warnings</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gemini restricts prescribing dosage rates or recommending banned chemical mixes. Non-chemical cultural control paths are always prioritized.
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Writing Good Advisory Requests</h3>
          <p className="text-sm text-slate-650 leading-relaxed">
            When completing the advisory question form, provide a detailed description of the scenario. Rather than asking:
            <br/>
            <code className="text-xs bg-slate-100 text-slate-800 p-1.5 rounded mt-2 inline-block font-mono">"My tomatoes are bad, help."</code>
            <br/>
            Include clear growth stages, symptoms, and context:
            <br/>
            <code className="text-xs bg-emerald-50 text-emerald-800 p-1.5 rounded mt-2 inline-block font-semibold">
              "Tomato plants in vegetative stage show yellow halos on bottom leaves with dark ring spots. Drip irrigating twice a week. Clay soil. Recent weather was extremely humid."
            </code>
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Image Capture Guidelines</h3>
          <div className="space-y-2 text-sm text-slate-650 leading-relaxed">
            <p>For high-quality leaf analysis, upload photos that meet these conditions:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong>Lighting:</strong> Take photos in clear daylight, avoiding heavy shadows or backlighting.</li>
              <li><strong>Focus:</strong> Ensure the camera focus is locked on the leaf spot or pest, not on background soil.</li>
              <li><strong>Resolution:</strong> Close-up shots of both the front and back of the affected leaf are highly recommended.</li>
              <li><strong>Size limit:</strong> Each image must be under 5MB and in JPEG, PNG, or WebP format.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Understanding Confidence Metrics</h3>
          <div className="space-y-3 text-sm text-slate-650 leading-relaxed">
            <p>Every generated report displays one of three confidence scores:</p>
            <div className="space-y-2.5">
              <div className="flex items-start space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 border border-emerald-200">High</span>
                <p className="text-xs text-slate-550">Sufficient consistent facts are present. Soil type, irrigation source, crop variety, and symptoms are completely clear.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 border border-amber-200">Medium</span>
                <p className="text-xs text-slate-550">A few potential explanations are plausible. Minor details like coordinates or exact NPK values might be missing.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 border border-red-200">Low</span>
                <p className="text-xs text-slate-550">Symptoms are vague, photos are blurry, or key agricultural inputs are unknown. Local pathology clinic confirmation is advised.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Pesticide Application Safety</span>
          </h3>
          <p className="text-xs text-slate-550 leading-relaxed">
            AgriGuide complies with global environmental health policies. The AI will never provide chemical dosage or tank-mixing rates. Pesticide formulations are regulated locally. Always check the legally approved product label, apply protective gear (gloves, goggles, mask), maintain pre-harvest waiting periods, and consult extension officers before chemical treatments.
          </p>
        </div>
      </div>
    </div>
  );
};
export default HelpPage;
