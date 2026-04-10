import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-link-generator",
  imports: [CommonModule, FormsModule],
  templateUrl: "./link-generator.html",
  styleUrl: "./link-generator.css",
})
export class LinkGenerator {
  receiverEmail = "";
  generatedLink = "";
  errorMessage = "";
  shareMessage = "";

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private parseReceiverEmails(input: string): string[] {
    return input
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  generateLink() {
    this.errorMessage = "";
    this.shareMessage = "";

    const emailInput = this.receiverEmail.trim();
    const emails = this.parseReceiverEmails(emailInput);

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

    this.generatedLink = `${origin}/feedback?receiver=${encodeURIComponent(emails.join(","))}`;
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
