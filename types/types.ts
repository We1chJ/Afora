import { DocumentData, Timestamp } from "firebase/firestore";

/**
 * - editor: members who can edit the documents
 * - admin: administrators who have higher access 
 */
export const access_roles: string[] = ['editor', 'admin'];

export type User = {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    emailAddresses: string;
    imageUrl: string;
    unsafeMetadata: {
        demographic?: string;  // Use optional chaining here
        gender?: string;
    };
}

export type Project = {
    projId: string;
    orgId: string;
    title: string;
    members: string[];
    teamCharterResponse: string[];
    // Add other fields as necessary
}

export type Organization = {
    title: string;
    description: string;
    admins: string[];
    members: string[];
}

// this structure describes the subcollection 'org' document under each user
// orgId and userId are not repetitive and are needed for quick query when deleting organizations
export interface UserOrgData extends DocumentData {
    createdAt: string;
    role: string;
    orgId: string;
    userId: string;
}

export const appHeader = ['Core Skills and Expertise', 'Current Interests', 'Fields Seeking to Pursue'];
export const appQuestions = ['What is your primary area of expertise and main professional skills?', 'What industries or fields are you currently most interested in some levels of skills and experiences?', 'What future roles or job titles are you aiming for?'];
export const appTags = [
    "Web Development",
    "Data Science",
    "UI/UX Design",
    "Product Management",
    "Cybersecurity",
    "Machine Learning",
    "Software Engineering",
    "Cloud Computing",
    "Project Management",
    "Business Analysis",
    "Graphic Design",
    "DevOps",
    "Quality Assurance",
    "Digital Marketing",
    "Content Writing",
    "Video Editing",
    "Game Development",
    "Mobile Development",
    "Systems Architecture",
    "Data Engineering",
    "Blockchain",
    "SEO",
    "Network Security",
    "Copywriting",
    "Sales",
    "Customer Support",
    "Financial Analysis",
    "Human Resources",
    "IT Support",
    "Deep Learning",
    "NLP",
    "Operations Management",
    "E-commerce",
    "Legal Consulting",
    "Data Analysis",
    "Statistics",
    "Risk Management",
    "IT Consulting",
    "Supply Chain",
    "UI Design",
    "UX Research",
    "Visual Design",
    "Animation",
    "Social Media",
    "Advertising",
    "Brand Strategy",
    "Research",
    "Public Relations",
    "Fundraising",
    "Training",
    "Health Informatics",
    "Clinical Research",
    "Education",
    "Economics",
    "Physics",
    "Healthcare",
    "Psychology",
    "Environmental Science",
    "Logistics",
    "Electronics",
    "Embedded Systems",
    "Robotics",
    "Manufacturing",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Artificial Intelligence",
    "Customer Experience",
    "Talent Acquisition",
    "Corporate Strategy",
    "Policy Analysis",
    "Event Planning",
];

// TODO: moved to somewhere else beause questions can be customized by org admin
export const projHeader = ['Hard Skills', 'Communication Style', 'Project Preferences', 'Extreme Preferences', 'Time Availability']
export const projQuestions = ['What are your top three technical or professional skills? Which tools, frameworks, or technologies are you proficient in?', 'What is your preferred method of communication for this project? (e.g., Slack, Email, Video calls) How often do you prefer to receive updates or engage with teammates? (e.g., daily, weekly)', 'What kind of project structure do you prefer? (e.g., rigid with clear processes, or flexible with more autonomy) What industry or type of project excites you most for this specific collaboration?', 'Anyone you definitely want to work with for this project? Someone you definitely do not want to work with for this project?', 'What days and times are you available to work on this project? (Please share a preferred weekly schedule or select available times like in When2Meet)'];

//TODO: make this customizable
export const teamCharterQuestions = ['Project Purpose', 'Key Project Stakeholders', 'Product Objectives']

// export interface Task {
//     id: string
//     title: string
//     column: string
//     assigned: Array<string>
//     date: string
// }

export type Stage = {
    id: string;
    title: string;
    order: number;
    tasksCompleted: number;
    totalTasks: number;
}

export type Task = {
    id: string;
    title: string;
    description: string;
    assignedTo: string; // TODO: one person per task or could be multiple?
    deadline: string;
    order: number;
    isCompleted: boolean;
}

export type GeneratedTasks = {
    stages: {
        stage_name: string; // The name of the stage
        tasks: {
            task_name: string; // The name of the task
            task_description: string; // The detailed description of the task
            assigned_user: string; // The user to whom the task is assigned
        }[];
    }[];
};

export type Comment = {
    message: string;
    msgId: string;
    time: Timestamp;
    uid: string;
}