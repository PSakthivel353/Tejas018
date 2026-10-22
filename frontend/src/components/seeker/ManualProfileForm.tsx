"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button, Card, CardHeader, Field, SkillChip, inputClass } from "@/components/ui";
import type { SeekerProfile } from "@/lib/types";

const TRADE_PRESETS: Record<string, string[]> = {
  "CNC Operation": ["G-code programming", "Lathe operation", "Blueprint reading", "Tool offset setting", "Micrometer and vernier use"],
  "EV Mechanic": ["Battery pack assembly", "Motor diagnostics", "High voltage safety", "Wiring harness repair"],
  "Solar Technician": ["PV panel installation", "Inverter wiring", "Roof mounting", "System testing"],
  "Electrician": ["Conduit wiring", "Panel board installation", "Circuit tracing", "Earthing standards"],
  "Welder": ["Arc welding", "MIG/TIG welding", "Gas cutting", "Weld inspection"],
  "Fitter": ["Bench fitting", "Marking and filing", "Drilling", "Assembly tolerances"],
  "Turner": ["Lathe operation", "Facing and turning", "Thread cutting", "Taper turning"],
  "Refrigeration & AC": ["Compressor overhaul", "Refrigerant charging", "Leak detection", "Ductwork"],
};

export function ManualProfileForm({
  initialName = "",
  initialTrade = "CNC Operation",
  onProfileCreated,
}: {
  initialName?: string;
  initialTrade?: string;
  onProfileCreated: (profile: SeekerProfile) => void;
}) {
  const [name, setName] = useState(initialName || "Arun Kumar");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [trade, setTrade] = useState(initialTrade);
  const [experience, setExperience] = useState("1-2 years");
  const [skills, setSkills] = useState<string[]>(TRADE_PRESETS[initialTrade] || ["G-code programming", "Lathe operation"]);
  const [customSkill, setCustomSkill] = useState("");

  const handleTradeChange = (newTrade: string) => {
    setTrade(newTrade);
    setSkills(TRADE_PRESETS[newTrade] || []);
  };

  const addSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const tradeIds: Record<string, number> = {
      "CNC Operation": 1,
      "EV Mechanic": 2,
      "Solar Technician": 3,
      Electrician: 4,
      Fitter: 5,
      Turner: 6,
      Welder: 7,
      "Refrigeration & AC": 8,
    };

    const profile: SeekerProfile = {
      seeker_id: 101,
      name: name.trim() || "Candidate",
      trade_id: tradeIds[trade] || 1,
      detected_trade: trade,
      skills: skills.length > 0 ? skills : ["General Technical Skills"],
      confidence: 0.95,
      phone,
      experience,
    };

    onProfileCreated(profile);
  };

  return (
    <Card>
      <CardHeader
        title="Fill profile manually"
        description="Enter your trade skills and experience directly to find matching jobs."
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" htmlFor="man-name">
            <input
              id="man-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Arun Kumar"
            />
          </Field>
          <Field label="Phone / WhatsApp" htmlFor="man-phone">
            <input
              id="man-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your Trade / ITI Course" htmlFor="man-trade">
            <select
              id="man-trade"
              value={trade}
              onChange={(e) => handleTradeChange(e.target.value)}
              className={inputClass}
            >
              {Object.keys(TRADE_PRESETS).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Work Experience" htmlFor="man-exp">
            <select
              id="man-exp"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className={inputClass}
            >
              <option value="Fresher / ITI Trainee">Fresher / ITI Trainee</option>
              <option value="1-2 years">1-2 years experience</option>
              <option value="3-5 years">3-5 years experience</option>
              <option value="5+ years">5+ years experience</option>
            </select>
          </Field>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Your Skills</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full hover:bg-accent/20"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add another skill (press enter or click Add)"
              className={inputClass}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full">
            Save Profile & Find Recommended Jobs
          </Button>
        </div>
      </form>
    </Card>
  );
}

