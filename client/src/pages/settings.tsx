import { useState } from "react";
import { DEFAULT_PROJECT_ID } from "@/lib/constants";

const PROJECT_ID = DEFAULT_PROJECT_ID;
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Environment, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Users, Globe, Trash, CopySimple, ArrowsClockwise, Warning } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";

type SettingsTab = "environments" | "team" | "project";

function MaskedKey({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  const { toast } = useToast();
  const masked = value.slice(0, 6) + "••••••••";

  function copy() {
    navigator.clipboard.writeText(value);
    toast({ title: "API key copied" });
  }

  return (
    <div className="flex items-center gap-2">
      <code className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-mono border border-border flex-1 tracking-wide">
        {show ? value : masked}
      </code>
      <button
        onClick={() => setShow(!show)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-border hover:bg-muted"
      >
        {show ? "Hide" : "Show"}
      </button>
      <button
        onClick={copy}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Copy"
      >
        <CopySimple size={14} />
      </button>
    </div>
  );
}

function EnvironmentsTab({ envs, isLoading }: { envs?: Environment[]; isLoading: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Environments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">API keys for SDK integration</p>
        </div>
      </div>
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Environment</th>
              <th className="px-4 py-2.5 font-medium">Key</th>
              <th className="px-4 py-2.5 font-medium">API Key</th>
              <th className="px-4 py-2.5 font-medium w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-6 rounded" />
                    </td>
                  </tr>
                ))
              : (envs ?? []).map((env) => (
                  <tr key={env.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-foreground">{env.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                        {env.envKey}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <MaskedKey value={env.clientApiKey} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Rotate key (coming soon)"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors opacity-50 cursor-not-allowed"
                        >
                          <ArrowsClockwise size={13} />
                        </button>
                        <button
                          title="Delete (coming soon)"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-50 cursor-not-allowed"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 px-4 py-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs">
        <strong>Eval API:</strong> <code className="font-mono">GET /eval/:apiKey</code> — returns all flag states for the environment.
      </div>
    </div>
  );
}

function TeamTab({ users, isLoading }: { users?: User[]; isLoading: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage who has access</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity opacity-50 cursor-not-allowed"
          title="Invite (coming in Stage 6)"
        >
          Invite
        </button>
      </div>
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLoading
              ? [1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-6 rounded" />
                    </td>
                  </tr>
                ))
              : (users ?? []).map((user) => (
                  <tr key={user.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {(user.fullName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.fullName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase",
                          user.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-muted-foreground"}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectTab() {
  const [confirmDelete, setConfirmDelete] = useState("");
  const PROJECT_KEY = "ff-demo";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Project Settings</h3>
        <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">
              Project Name
            </label>
            <input
              defaultValue="Feature Flags Demo"
              className="w-full max-w-sm px-3 py-1.5 text-sm border border-border rounded-md bg-card focus:ring-1 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">
              Project Key
            </label>
            <input
              readOnly
              value={PROJECT_KEY}
              className="w-full max-w-sm px-3 py-1.5 text-sm border border-border rounded-md bg-muted font-mono text-xs text-muted-foreground outline-none cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Project key cannot be changed after creation.</p>
          </div>
          <div className="pt-1">
            <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity opacity-60 cursor-not-allowed">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive/40 rounded-lg p-5 bg-destructive/5">
        <div className="flex items-center gap-2 mb-2">
          <Warning size={15} weight="fill" className="text-destructive" />
          <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Deleting the project will permanently remove all flags, environments, and audit logs.
          This action is <strong>irreversible</strong>.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Type "${PROJECT_KEY}" to confirm`}
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className="px-3 py-1.5 text-xs border border-border rounded-md bg-card max-w-xs outline-none focus:ring-1 focus:ring-destructive/30"
          />
          <button
            disabled={confirmDelete !== PROJECT_KEY}
            className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("environments");

  const { data: envs, isLoading: envsLoading } = useQuery<Environment[]>({
    queryKey: [`environments/${DEFAULT_PROJECT_ID}`],
  });
  const users: any[] = []; const usersLoading = false;

  const tabs: { key: SettingsTab; label: string; icon: typeof Key }[] = [
    { key: "environments", label: "Environments", icon: Globe },
    { key: "team", label: "Team", icon: Users },
    { key: "project", label: "Project", icon: Key },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <header className="h-11 shrink-0 border-b border-border flex items-center px-6 bg-card">
        <h1 className="text-sm font-semibold text-foreground">Settings</h1>
      </header>

      <div className="p-6 max-w-[860px] mx-auto">
        {/* Settings tabs */}
        <div className="flex border-b border-border mb-6 gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-none bg-none cursor-pointer border-b-2 transition-all -mb-px",
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                ].join(" ")}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "environments" && (
          <EnvironmentsTab envs={envs} isLoading={envsLoading} />
        )}
        {activeTab === "team" && (
          <TeamTab users={users} isLoading={usersLoading} />
        )}
        {activeTab === "project" && <ProjectTab />}
      </div>
    </div>
  );
}
