import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, Brain, CheckCircle2, FileText, FolderGit2, Loader2, Mic, Trash2, UploadCloud } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, Field, Page, PageHeader, PageSkeleton, Section, SegmentedControl } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBadgeCatalog } from "@/hooks/useBadgeCatalog";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

function Chips({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className="rounded-md border bg-background px-2 py-1 text-xs">
          {s}
        </span>
      ))}
    </div>
  );
}

function UploadForm({ onDone }) {
  const [mode, setMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const upload = useMutation({
    mutationFn: () => {
      const form = new FormData();
      if (mode === "text") form.append("text", text);
      else form.append("resume", file);
      if (jobDescription.trim()) form.append("jobDescription", jobDescription.trim());
      return api.post("/resume", form).then((r) => r.data);
    },
    onSuccess: onDone,
  });

  const pick = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") return setFileError("Please choose a PDF file.");
    if (f.size > 5 * 1024 * 1024) return setFileError("That file is over 5 MB.");
    setFileError("");
    setFile(f);
  };

  const ready = mode === "text" ? text.trim().length >= 200 : Boolean(file);

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5 shadow-xs sm:p-7">
      <SegmentedControl
        aria-label="Resume source"
        value={mode}
        onChange={setMode}
        options={[
          { value: "pdf", label: "Upload PDF" },
          { value: "text", label: "Paste text" },
        ]}
        className="w-full sm:w-72"
      />

      {mode === "text" ? (
        <Field hint={`${text.trim().length} characters · at least 200 needed`}>
          <Textarea className="min-h-48" placeholder="Paste the full text of your resume…" value={text} onChange={(e) => setText(e.target.value)} maxLength={20000} />
        </Field>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex w-full flex-col items-center rounded-lg border border-dashed px-6 py-10 transition",
              dragging ? "border-primary bg-primary/5" : "hover:border-foreground/30 hover:bg-accent/40"
            )}
          >
            <UploadCloud className="mb-3 h-6 w-6 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drop your resume here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, up to 5 MB</p>
              </>
            )}
          </button>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
        </div>
      )}

      <Field label="Target job description" htmlFor="jd" hint="Optional — we'll show which skills the role asks for that your resume lacks.">
        <Textarea id="jd" className="min-h-24" placeholder="Paste a job posting…" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} maxLength={5000} />
      </Field>

      {upload.error && <Alert>{errorMessage(upload.error)}</Alert>}
      <div className="flex flex-col-reverse items-start justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">Stored on your account only. Delete it anytime.</p>
        <Button size="lg" disabled={!ready || upload.isPending} onClick={() => upload.mutate()}>
          {upload.isPending ? <Loader2 className="animate-spin" /> : <FileText />}
          {upload.isPending ? "Analyzing…" : "Analyze resume"}
        </Button>
      </div>
    </div>
  );
}

export default function Resume() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const catalog = useBadgeCatalog();
  const [replacing, setReplacing] = useState(false);

  const { data: resume, isLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () =>
      api
        .get("/resume")
        .then((r) => r.data.resume)
        .catch((err) => {
          if (err.response?.status === 404) return null;
          throw err;
        }),
  });

  const remove = useMutation({
    mutationFn: () => api.delete("/resume"),
    onSuccess: () => {
      queryClient.setQueryData(["resume"], null);
      refreshUser().catch(() => {});
    },
  });

  const onUploaded = (data) => {
    queryClient.setQueryData(["resume"], data.resume);
    setReplacing(false);
    refreshUser().catch(() => {});
    for (const id of data.newBadges ?? []) {
      const b = catalog[id];
      if (b) {
        celebrate();
        toast({ title: `Badge unlocked: ${b.name}`, description: b.description });
      }
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="Resume"
        description="Upload your resume and every interview mode can ask about your real projects and skills."
        actions={
          resume &&
          !replacing && (
            <>
              <Button variant="outline" onClick={() => setReplacing(true)}>
                Replace
              </Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => window.confirm("Delete your resume from Prepify?") && remove.mutate()}>
                <Trash2 /> Delete
              </Button>
            </>
          )
        }
      />

      {!resume || replacing ? (
        <>
          <UploadForm onDone={onUploaded} />
          {replacing && (
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => setReplacing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <Section>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {resume.fileName}
              </span>
              <span>Uploaded {formatDate(resume.uploadedAt)}</span>
              <span className="rounded-md border px-1.5 py-0.5 capitalize text-foreground">{resume.experienceLevel} level</span>
            </div>
            <p className="leading-relaxed">{resume.summary}</p>
            {resume.suggestedRoles?.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Roles that fit</p>
                <Chips items={resume.suggestedRoles} />
              </div>
            )}
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Skills found" icon={CheckCircle2}>
              <Chips items={resume.skills} />
            </Section>
            <Section title="Gaps to prepare" icon={AlertTriangle}>
              {resume.gaps?.length ? <Chips items={resume.gaps} /> : <p className="text-sm text-muted-foreground">No major gaps found.</p>}
            </Section>
          </div>

          {resume.projects?.length > 0 && (
            <Section title="Projects interviewers will ask about" icon={FolderGit2} padded={false}>
              <ul className="divide-y text-sm">
                {resume.projects.map((p) => (
                  <li key={p} className="px-5 py-3">
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { to: "/setup", icon: Brain, title: "Personalized MCQ", text: "Tick “Personalize from my resume”" },
              { to: "/voice", icon: Mic, title: "Personalized voice interview", text: "Get asked about your own projects" },
            ].map(({ to, icon: Icon, title, text }) => (
              <Link key={to} to={to} className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-xs transition hover:border-foreground/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-xs text-muted-foreground">{text}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
