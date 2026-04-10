import { Routes } from "@angular/router";
import { OnsiteFeedback } from "./onsite-feedback/onsite-feedback";
import { LinkGenerator } from "./link-generator/link-generator";

export const routes: Routes = [
	{ path: "", redirectTo: "link-generator", pathMatch: "full" },
	{ path: "link-generator", component: LinkGenerator },
	{ path: "feedback", component: OnsiteFeedback },
	{ path: "**", redirectTo: "link-generator" },
];
