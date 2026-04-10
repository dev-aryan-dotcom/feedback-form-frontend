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

  generateLink() {
    this.errorMessage = "";
    this.copyMessage = "";
    this.copyButtonLabel = "Copy Link";

    const email = this.receiverEmail.trim();

    if (!email) {
      this.errorMessage = "Receiver email is required.";
      this.generatedLink = "";
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = "Enter a valid receiver email.";
      this.generatedLink = "";
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:4200";

    this.generatedLink = `${origin}/feedback?receiver=${encodeURIComponent(email)}`;
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
