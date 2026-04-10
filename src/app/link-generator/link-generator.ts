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
  copyMessage = "";
  copyButtonLabel = "Copy Link";

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
    this.copyMessage = "";
    this.copyButtonLabel = "Copy Link";

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

  async copyLink() {
    this.copyMessage = "";

    if (!this.generatedLink) {
      this.errorMessage = "Generate a link before copying.";
      return;
    }

    this.copyButtonLabel = "Copied";

    try {
      await navigator.clipboard.writeText(this.generatedLink);
      this.copyMessage = "Link copied to clipboard.";
      this.errorMessage = "";
    } catch {
      this.copyButtonLabel = "Copy Link";
      this.errorMessage = "Unable to copy link automatically. Please copy it manually.";
    }
  }
}
