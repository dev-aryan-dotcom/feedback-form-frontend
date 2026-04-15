import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  FormBuilder,
  Validators,
  FormGroup,
} from "@angular/forms";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-onsite-feedback",
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: "./onsite-feedback.html",
  styleUrl: "./onsite-feedback.css",
})
export class OnsiteFeedback {
  feedbackForm!: FormGroup;
  successMessage = false;
  errorMessage = "";
  isSubmitted = false;
  isSubmitting = false;
  receiverEmails: string[] = [];
  receiverToken = "";

  detailedRatingOptions = [
    "Needs Improvement",
    "Meets Expectations",
    "Exceeds Expectations",
  ];

  ratingItems = [
    { label: "Technical Skills", control: "technicalSkillsRating" },
    { label: "Problem Solving", control: "problemSolvingRating" },
    { label: "Initiative & Ownership", control: "initiativeRating" },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get token or receiver list from URL
    this.route.queryParams.subscribe((params) => {
      this.receiverToken = String(params["t"] || "").trim();
      const receiverParam = params["receiver"] || "";
      this.receiverEmails = String(receiverParam)
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (!this.receiverEmails.length && this.receiverToken && typeof window !== "undefined") {
        try {
          const storedReceivers = window.sessionStorage.getItem(`feedback-link:${this.receiverToken}`);
          if (storedReceivers) {
            const parsedReceivers = JSON.parse(storedReceivers);
            if (Array.isArray(parsedReceivers)) {
              this.receiverEmails = parsedReceivers
                .map((email) => String(email).trim())
                .filter((email) => email.length > 0);
            }
          }
        } catch {
          // Ignore malformed local storage data and fall back to token lookup.
        }
      }
    });

    const today = new Date().toISOString().split("T")[0];

    this.feedbackForm = this.fb.group({
      devName: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      feedbackDate: [today, Validators.required],
      clientSite: ["", Validators.required],
      role: ["", Validators.required],
      period: ["", Validators.required],
      collabRating: ["", Validators.required],
      deliveryRating: ["", Validators.required],
      technicalSkillsRating: [null, Validators.required],
      problemSolvingRating: [null, Validators.required],
      initiativeRating: [null, Validators.required],
      comments: ["", Validators.required],
      improvements: ["", Validators.required],
    });
  }

  onSubmit() {
    this.successMessage = false;
    this.errorMessage = "";

    if (this.feedbackForm.invalid) {
      this.errorMessage =
        "⚠️ Please fill all required fields marked with asterisk (*)";
      this.feedbackForm.markAllAsTouched();
      return;
    }

    if (!this.receiverToken && !this.receiverEmails.length) {
      this.errorMessage = "⚠️ No receiver email configured. Contact admin.";
      return;
    }

    this.isSubmitting = true;
    this.feedbackForm.disable();

    const formData = this.feedbackForm.value;

    const payload: {
      token?: string;
      receiverEmail?: string[];
      clientEmail: string;
      feedback: any;
    } = {
      clientEmail: formData.clientEmail,
      feedback: formData,
    };

    if (this.receiverToken) {
      payload.token = this.receiverToken;
    } else {
      payload.receiverEmail = this.receiverEmails;
    }

    if (this.receiverEmails.length) {
      payload.receiverEmail = this.receiverEmails;
    }

    console.log("📤 Sending payload:", payload);

    this.http
      .post(`${environment.apiUrl}/send-feedback`, payload)
      .subscribe({
      next: (response) => {
        console.log("✅ Email sent successfully", response);
        this.afterSuccess(formData);
      },
      error: (err) => {
        console.error("❌ Error sending email:", err);
        this.errorMessage = `❌ Failed to send email: ${
          err.error?.message || err.message || "Unknown error"
        }`;
        this.isSubmitting = false;
        this.feedbackForm.enable();
      },
    });
  }

  afterSuccess(formData: any) {
    this.successMessage = false;
    this.isSubmitted = false;

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Client Feedback Form - Response", 14, 20);

      const displayValue = (value: any): string => {
        if (value === null || value === undefined) return "Not Provided";
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed ? trimmed : "Not Provided";
        }
        return String(value);
      };

      const pdfBodyRows: (string | number)[][] = [
        ["Employee Name", displayValue(formData.devName)],
        ["Client Email", displayValue(formData.clientEmail)],
        ["Date of Feedback", displayValue(formData.feedbackDate)],
        ["Client Site", displayValue(formData.clientSite)],
        ["Role", displayValue(formData.role)],
        ["Period", displayValue(formData.period)],
        ["Collaboration", displayValue(formData.collabRating)],
        ["Delivery", displayValue(formData.deliveryRating)],
        ["Technical Skills", displayValue(formData.technicalSkillsRating)],
        ["Problem Solving", displayValue(formData.problemSolvingRating)],
        ["Initiative & Ownership", displayValue(formData.initiativeRating)],
        ["Improvements", displayValue(formData.improvements)],
        ["Comments", displayValue(formData.comments)],
      ];

      autoTable(doc, {
        startY: 30,
        head: [["Category", "Feedback Details"]],
        body: pdfBodyRows,
        theme: "grid",
      });

      doc.save(`Feedback_${formData.devName}_${formData.feedbackDate}.pdf`);
      this.successMessage = true;
      this.isSubmitted = true;
    } catch (error) {
      console.error("❌ PDF generation failed:", error);
      this.errorMessage =
        "✅ Feedback submitted, but PDF download failed. Please try again.";
    }

    // Reset form with date default
    const today = new Date().toISOString().split("T")[0];
    this.feedbackForm.reset({ feedbackDate: today });
    this.isSubmitting = false;
    this.feedbackForm.enable();

    setTimeout(() => {
      this.isSubmitted = false;
      this.successMessage = false;
    }, 3000);
  }
}
