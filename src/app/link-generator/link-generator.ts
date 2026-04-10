import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-link-generator",
  imports: [CommonModule, FormsModule],
  templateUrl: "./link-generator.html",
  styleUrl: "./link-generator.css",
})
export class LinkGenerator {
  receiverInput = "";
  receiverEmails: string[] = [];
  generatedLink = "";
  errorMessage = "";
  shareMessage = "";
  isGeneratingLink = false;

  constructor(private http: HttpClient) {}

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private parseReceiverEmails(input: string): string[] {
    return input
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  private addReceiverEmailsFromInput(): void {
    const emails = this.parseReceiverEmails(this.receiverInput);

    for (const email of emails) {
      if (!this.isValidEmail(email)) {
        continue;
      }

      if (!this.receiverEmails.includes(email)) {
        this.receiverEmails.push(email);
      }
    }

    this.receiverInput = "";
  }

  removeReceiverEmail(index: number) {
    this.receiverEmails.splice(index, 1);
  }

  private createToken(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }

    const randomValues = new Uint8Array(24);
    (typeof crypto !== "undefined" ? crypto : window.crypto).getRandomValues(randomValues);
    return Array.from(randomValues, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  generateLink() {
    this.errorMessage = "";
    this.shareMessage = "";

    this.addReceiverEmailsFromInput();
    const emails = this.receiverEmails;

    if (!emails.length) {
      this.errorMessage = "At least one receiver email is required.";
      this.generatedLink = "";
      return;
    }

    const invalidEmails = emails.filter((email) => !this.isValidEmail(email));
    if (invalidEmails.length) {
      this.errorMessage = `Invalid receiver email(s): ${invalidEmails.join(", ")}`;
      this.generatedLink = "";
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:4200";
    const token = this.createToken();
    this.generatedLink = `${origin}/feedback?t=${encodeURIComponent(token)}`;

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(`feedback-link:${token}`, JSON.stringify(emails));
    }

    this.isGeneratingLink = true;

    this.http
      .post<{ token: string }>(`${environment.apiUrl}/generate-feedback-link`, {
        token,
        receiverEmail: emails,
      })
      .subscribe({
        next: (response) => {
          this.generatedLink = `${origin}/feedback?t=${encodeURIComponent(response.token || token)}`;
          this.errorMessage = "";
          this.isGeneratingLink = false;
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || "Secure token generation failed.";
          this.isGeneratingLink = false;
        },
      });
  }

  onReceiverKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      this.addReceiverEmailsFromInput();
    }
  }

  onReceiverPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData("text") || "";
    if (pastedText.includes(",")) {
      event.preventDefault();
      this.receiverInput = `${this.receiverInput}${pastedText}`;
      this.addReceiverEmailsFromInput();
    }
  }

  openGeneratedLink() {
    if (!this.generatedLink) {
      this.errorMessage = "Generate a link before opening it.";
      return;
    }

    window.open(this.generatedLink, "_blank", "noopener,noreferrer");
  }

  async shareGeneratedLink() {
    this.shareMessage = "";

    if (!this.generatedLink) {
      this.errorMessage = "Generate a link before sharing it.";
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Client Feedback Form",
          text: "Please use this link to submit feedback.",
          url: this.generatedLink,
        });
        this.shareMessage = "Link shared successfully.";
        this.errorMessage = "";
        return;
      } catch {
        // Continue to clipboard fallback if sharing is cancelled or fails.
      }
    }

    try {
      await navigator.clipboard.writeText(this.generatedLink);
      this.shareMessage = "Sharing is not available here. Link copied to clipboard.";
      this.errorMessage = "";
    } catch {
      this.errorMessage = "Unable to share link automatically. Please copy it manually.";
    }
  }
}
