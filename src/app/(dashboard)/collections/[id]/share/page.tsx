"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Check, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";

async function fetchGallery(id: string) {
  const res = await fetch(`/api/galleries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.gallery;
}

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: gallery } = useQuery({
    queryKey: ["gallery", id],
    queryFn: () => fetchGallery(id),
  });

  const galleryUrl = gallery
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/g/${gallery.slug}`
    : "";

  async function copyLink() {
    await navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`/api/galleries/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      if (res.ok) {
        setSent(true);
        setEmail("");
        setMessage("");
        setTimeout(() => setSent(false), 3000);
        toast.success("Invitation sent!");
      } else {
        toast.error("Failed to send invitation");
      }
    } catch {
      toast.error("Failed to send invitation");
    }
    setSending(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href={`/collections/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to collection
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-8">Share Gallery</h1>

      {/* Copy link section */}
      <div className="space-y-3 mb-8">
        <Label>Gallery link</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={galleryUrl} className="font-mono text-sm min-w-0" />
          <Button variant="outline" onClick={copyLink} className="w-full sm:w-auto">
            {copied ? (
              <Check className="size-4 mr-2" />
            ) : (
              <Copy className="size-4 mr-2" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {gallery && (
          <Link
            href={`/g/${gallery.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            Preview gallery
          </Link>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Email share */}
      <div className="space-y-3">
        <Label>Send via email</Label>
        <form onSubmit={sendEmail} className="space-y-4">
          <Input
            type="email"
            placeholder="client@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Add a personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={sending}>
            {sent ? (
              <>
                <Check className="size-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                {sending ? "Sending..." : "Send Invitation"}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
