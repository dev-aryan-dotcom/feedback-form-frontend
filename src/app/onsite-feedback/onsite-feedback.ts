import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormArray,
  FormControl,
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
  receiverEmail: string = "";

  ratingOptions = [1, 2, 3, 4, 5];

  ratingItems = [
    { label: "Technical Skills", control: "technicalSkillsRating" },
    { label: "Communication", control: "communicationRating" },
    { label: "Quality of Work", control: "qualityRating" },
    { label: "Timeliness", control: "timelinessRating" },
    { label: "Problem Solving", control: "problemSolvingRating" },
    { label: "Team Collaboration", control: "teamCollaborationRating" },
    { label: "Initiative & Ownership", control: "initiativeRating" },
    { label: "Domain Understanding", control: "domainUnderstandingRating" },
  ];

  techOptions = [
    { label: "☕ Java / Spring Boot", value: "Java / Spring Boot" },
    { label: "⚛️ Frontend (React/Angular)", value: "React / Angular" },
    { label: "📁 SharePoint Online", value: "SharePoint Online" },
    { label: "🧩 SPFx", value: "SharePoint Framework SPFx" },
    { label: "🔗 REST APIs", value: "REST APIs / Integration" },
    { label: "🗄️ SQL / DB", value: "SQL / Database" },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get receiver email from URL
    this.route.queryParams.subscribe((params) => {
      this.receiverEmail = params["receiver"] || "";
    });

    const today = new Date().toISOString().split("T")[0];

    this.feedbackForm = this.fb.group({
      devName: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      feedbackDate: [today, Validators.required],
      clientSite: ["", Validators.required],
      role: ["", Validators.required],
      period: ["", Validators.required],
      overallRating: ["", Validators.required],
      techCheckGroup: this.fb.array([]),
      collabRating: ["", Validators.required],
      deliveryRating: ["", Validators.required],
      technicalSkillsRating: [""],
      communicationRating: [""],
      qualityRating: [""],
      timelinessRating: [""],
      problemSolvingRating: [""],
      teamCollaborationRating: [""],
      initiativeRating: [""],
      domainUnderstandingRating: [""],
      comments: [""],
      improvements: [""],
    });
  }

  onTechChange(event: Event) {
    const techArray = this.feedbackForm.get("techCheckGroup") as FormArray;
    const isChecked = (event.target as HTMLInputElement).checked;
    const value = (event.target as HTMLInputElement).value;

    if (isChecked) {
      techArray.push(new FormControl(value));
    } else {
      const index = techArray.controls.findIndex((x) => x.value === value);
      if (index >= 0) techArray.removeAt(index);
    }
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

    if (!this.receiverEmail) {
      this.errorMessage = "⚠️ No receiver email configured. Contact admin.";
      return;
    }

    this.isSubmitting = true;
    this.feedbackForm.disable();

    const formData = this.feedbackForm.value;

    const payload = {
      receiverEmail: this.receiverEmail,
      clientEmail: formData.clientEmail,
      feedback: formData,
    };

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
    this.isSubmitting = false;
    this.successMessage = false;
    this.isSubmitted = false;

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Client Feedback Form - Response", 14, 20);

      const techText = formData.techCheckGroup.length
        ? formData.techCheckGroup.join(", ")
        : "Not Provided";

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
        ["Date of Feedback", displayValue(formData.feedbackDate)],
        ["Client Site", displayValue(formData.clientSite)],
        ["Role", displayValue(formData.role)],
        ["Period", displayValue(formData.period)],
        [
          "Overall Rating",
          formData.overallRating
            ? `${formData.overallRating} / 5`
            : "Not Provided",
        ],
        ["Collaboration", displayValue(formData.collabRating)],
        ["Delivery", displayValue(formData.deliveryRating)],
        ["Technical Skills", displayValue(formData.technicalSkillsRating)],
        ["Communication", displayValue(formData.communicationRating)],
        ["Quality of Work", displayValue(formData.qualityRating)],
        ["Timeliness", displayValue(formData.timelinessRating)],
        ["Problem Solving", displayValue(formData.problemSolvingRating)],
        ["Team Collaboration", displayValue(formData.teamCollaborationRating)],
        ["Initiative & Ownership", displayValue(formData.initiativeRating)],
        [
          "Domain Understanding",
          displayValue(formData.domainUnderstandingRating),
        ],
        ["Tech Strengths", techText],
        ["Comments", displayValue(formData.comments)],
        ["Improvements", displayValue(formData.improvements)],
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

    (this.feedbackForm.get("techCheckGroup") as FormArray).clear();
    this.feedbackForm.enable();

    setTimeout(() => {
      this.isSubmitted = false;
      this.successMessage = false;
    }, 3000);
  }
}
