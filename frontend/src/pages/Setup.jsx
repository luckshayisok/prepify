import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Briefcase, Clock, Hash, Loader2, Play, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientButton, PersonalizeToggle } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { LEVEL_STYLES } from "@/lib/format";

const DOMAINS = [
  "Custom",
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Database Management",
  "Operating Systems",
  "Computer Networks",
  "Machine Learning",
  "HTML/CSS",
];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = params.get("domain");

  const [domain, setDomain] = useState(preset ? (DOMAINS.includes(preset) ? preset : "Custom") : "");
  const [customDomain, setCustomDomain] = useState(preset && !DOMAINS.includes(preset) ? preset : "");
  const [numQuestions, setNumQuestions] = useState(10);
  const [level, setLevel] = useState("medium");
  const [timer, setTimer] = useState(10);
  const [personalized, setPersonalized] = useState(false);
  const [showJd, setShowJd] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finalDomain = domain === "Custom" ? customDomain.trim() : domain;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalDomain) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/interviews/mcq", {
        domain: finalDomain,
        level,
        numQuestions: Number(numQuestions),
        timer: Number(timer),
        personalized,
        jobDescription: jobDescription.trim(),
      });
      navigate(`/interview/${data.session.id}`, { state: data });
    } catch (err) {
      setError(errorMessage(err, "Couldn't generate questions"));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">MCQ Interview</h1>
          <p className="text-lg text-muted-foreground">AI-generated, timed, and scored with a topic-by-topic breakdown.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-xl ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-blue-600" /> Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Domain
                  </Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d === "Custom" ? "✏️ Custom topic…" : d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {domain === "Custom" && (
                    <Input
                      autoFocus
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g. Kubernetes networking, Redux Toolkit, SQL joins"
                      className="h-12"
                      maxLength={80}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Hash className="h-4 w-4" /> Questions
                    </Label>
                    <Input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Minutes
                    </Label>
                    <Input type="number" min="1" max="120" value={timer} onChange={(e) => setTimer(e.target.value)} className="h-12" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Difficulty</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["easy", "medium", "hard"].map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`h-11 rounded-xl border text-sm font-medium capitalize transition ${
                          level === l ? `${LEVEL_STYLES[l]} border-current ring-2 ring-current/20` : "hover:bg-accent"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <PersonalizeToggle checked={personalized} onChange={setPersonalized} hasResume={user?.hasResume} />

                <div>
                  <button
                    type="button"
                    onClick={() => setShowJd((s) => !s)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Briefcase className="h-4 w-4" /> {showJd ? "Remove" : "Add"} a job description (optional)
                  </button>
                  {showJd && (
                    <Textarea
                      className="mt-3 min-h-28"
                      placeholder="Paste the job posting — questions will focus on what it asks for."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      maxLength={5000}
                    />
                  )}
                </div>

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

                <GradientButton type="submit" disabled={!finalDomain || busy} className="h-12 w-full">
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating your questions…
                    </>
                  ) : (
                    <>
                      <Play /> Begin interview
                    </>
                  )}
                </GradientButton>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
