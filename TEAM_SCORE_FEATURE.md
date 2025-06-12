# Team Compatibility Scoring System

## Feature Overview

This system provides organizations with an intelligent team compatibility analysis feature. Based on team members' onboarding survey responses, it uses GPT API to analyze the team's overall compatibility and each member's capabilities.

## Key Features

### 1. Intelligent Analysis
- **GPT-Powered**: Uses OpenAI GPT API for deep team analysis
- **Comprehensive Assessment**: Analyzes skill complementarity, collaboration potential, and team balance
- **Personalized Recommendations**: Provides role suggestions and development directions for each member

### 2. Multi-dimensional Scoring
- **Overall Compatibility**: 0-100 team compatibility score
- **Individual Scores**: Each member's compatibility score with the team
- **Detailed Analysis**: Includes strengths, skills, interests, and role suggestions

### 3. Visual Display
- **Pie Chart**: Shows team overall compatibility
- **Bar Chart**: Compares each member's compatibility scores
- **Skills Distribution**: Visualizes team skill coverage

## Technical Implementation

### File Structure
```
ai_scripts/
├── analyzeTeamCompatibility.js  # GPT analysis logic
└── apiRequest.js               # OpenAI API request base function

components/
├── OrganizationScoreCard.tsx   # Main scoring card component
├── TeamScoreChart.tsx         # Chart visualization component
└── OrganizationPage.tsx       # Integration into organization page

actions/
└── actions.ts                 # Added data fetching functions

types/
└── types.ts                   # Added type definitions
```

### Core Components

#### 1. OrganizationScoreCard
- Main user interface component
- Handles data fetching and state management
- Integrates analysis results display
- Supports mock data mode

#### 2. TeamScoreChart
- Uses Recharts for data visualization
- Includes pie charts, bar charts, and skills distribution
- Dynamic color coding based on score levels

#### 3. analyzeTeamCompatibility
- GPT prompt engineering
- Structured JSON output
- English analysis results
- Error handling and fallback mechanisms

## Usage

### Using in Organization Page
The organization page now includes a new "Team Score" tab, which can be clicked to access team analysis functionality.

### Analysis Process
1. Click the "Start Team Analysis" button
2. System automatically retrieves team members' onboarding survey responses
3. Calls GPT API for intelligent analysis
4. Displays visualized analysis results

### Mock Data Mode
When the database is unavailable or there's no real data, the system automatically uses preset mock data for demonstration.

## GPT Prompt Design

The system uses carefully designed English prompts that include:
- Clear role definition (Professional Team Analyst)
- Detailed analysis requirements
- Clear scoring criteria
- Structured output format

## Data Structure

### Input Data
- Team member email list
- Onboarding survey questions
- Each member's survey responses

### Output Data
```typescript
interface TeamCompatibilityAnalysis {
  overall_score: number;
  member_analyses: {
    member_email: string;
    strengths: string[];
    skills: string[];
    interests: string[];
    compatibility_score: number;
    role_suggestion: string;
  }[];
  team_analysis: {
    team_strengths: string[];
    potential_gaps: string[];
    collaboration_potential: string;
    recommendations: string[];
  };
}
```

## Scoring Criteria

- **90-100 points**: Team members have highly complementary skills with excellent collaboration potential
- **80-89 points**: Good team configuration with strong collaboration foundation
- **70-79 points**: Balanced team with some room for improvement
- **60-69 points**: Team has obvious shortcomings requiring adjustments
- **Below 60 points**: Team configuration has serious issues

## Feature Highlights

### 1. Intelligent Fallback Mechanism
- Automatically uses mock data when real data is unavailable
- Provides graceful error handling when API calls fail

### 2. English Interface
- Fully English user interface
- English analysis results and recommendations

### 3. Responsive Design
- Adapts to different screen sizes
- Clear information hierarchy

### 4. Existing Component Reuse
- Fully utilizes the project's existing UI component library
- Maintains consistent design style

## Future Extensions

1. **More Chart Types**: Can add radar charts, heat maps, and other visualization methods
2. **Historical Trends**: Track changes in team compatibility over time
3. **Comparative Analysis**: Analysis between different teams
4. **Export Functionality**: Support PDF report export
5. **Personal Development Recommendations**: Individual growth path suggestions based on analysis results

## Environment Requirements

- OpenAI API key configuration
- Recharts chart library
- Existing Firebase and Clerk authentication systems
- Next.js 14+
- TypeScript support

This feature provides data-driven insights for team management, helping organizations better understand team structure, identify potential issues, and develop improvement strategies. 




# Mock GPT Testing Guide

## Overview

This testing system allows you to test real GPT API team compatibility analysis functionality using mock team member data, without worrying about authentication issues.

## 🔧 Setup Requirements

### 1. Environment Variable Configuration

Ensure your `.env.local` file contains a valid OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Dependency Check

Ensure the project has the required dependencies installed:
```bash
npm install openai dotenv
```

## 🧪 Test Cases

### Mock Team Member Data

The system uses the following 4 virtual team members:

| Member | Email | Role | Main Skills |
|--------|-------|------|-------------|
| Alice | alice@test.com | Frontend Development Expert | React, TypeScript, UI/UX Design |
| Bob | bob@test.com | Backend Architect | Node.js, PostgreSQL, Docker, AWS |
| Charlie | charlie@test.com | Project Manager | Project Management, Scrum, Business Analysis |
| David | david@test.com | Test Engineer | Testing, Quality Assurance, Automation |

### Survey Response Examples

Mock survey responses for each member:

**Alice's Responses:**
- Q1: React,TypeScript,UI/UX Design,CSS,JavaScript
- Q2: Web Development,Frontend Development,Mobile Development
- Q3: Senior Frontend Developer,UI/UX Designer,Product Manager

**Bob's Responses:**
- Q1: Node.js,PostgreSQL,Docker,AWS,System Architecture
- Q2: Backend Development,Cloud Computing,DevOps
- Q3: Backend Architect,DevOps Engineer,Technical Lead

## 🚀 Usage Methods

### Method 1: Simple Direct Test

1. Start the development server:
```bash
npm run dev
```

2. Visit the simple test page:
```
http://localhost:3000/simple-test
```

3. Click the "Start Team Analysis" button
4. Wait for GPT API analysis completion (usually takes 5-10 seconds)

### Method 2: Complete Test Flow

1. Visit the complete test page:
```
http://localhost:3000/test-group-score
```

2. Click "Create Mock Test Data"
3. View the generated organization and member information
4. Click "Start Team Analysis"
5. Observe GPT analysis results

## 📊 Analysis Results

GPT API will return analysis containing the following content:

### Overall Analysis
- **Overall Compatibility Score** (0-100)
- **Team Strengths** list
- **Potential Gaps** identification
- **Collaboration Potential** assessment
- **Improvement Recommendations** list

### Individual Analysis
Detailed analysis for each member includes:
- **Core Strengths** list
- **Technical Skills** tags
- **Areas of Interest** tags
- **Compatibility Score** (0-100)
- **Role Suggestions**

### Visualization Charts
- **Pie Chart**: Overall compatibility display
- **Bar Chart**: Member compatibility comparison
- **Skills Distribution Chart**: Team skill coverage

## 🔍 Test Verification Points

### 1. API Call Success
- Confirm seeing the success message "Team analysis completed! (Using mock data)"
- Analysis results are not pre-set hardcoded data

### 2. Data Quality Check
- Analysis results should reflect the skill combinations in mock data
- Scores should be reasonable (expected 80-90 points due to good team complementarity)
- Role suggestions should match members' skill backgrounds

### 3. Error Handling
- If API call fails, backup mock analysis results will be displayed
- Error messages will clearly indicate the reason for failure

## 🐛 Troubleshooting

### Common Issues

1. **"GPT Analysis Failed" Error**
   - Check if OPENAI_API_KEY is correctly set
   - Confirm API key has valid quota
   - Check network connection

2. **Long Loading Times**
   - GPT API calls usually take 5-15 seconds
   - If over 30 seconds, may be network or API issues

3. **Empty Analysis Results**
   - Check console for error messages
   - Confirm mock data is loaded correctly

### Debugging Tips

1. Open browser developer tools Console tab
2. Check if network requests are successful
3. Check for JavaScript errors

## 📝 Expected Output Example

A successful GPT analysis might return results similar to the following:

```json
{
  "overall_score": 87,
  "member_analyses": [
    {
      "member_email": "alice@test.com",
      "strengths": ["Frontend Excellence", "UI/UX Design", "Modern Framework Expertise"],
      "skills": ["React", "TypeScript", "CSS", "JavaScript", "Figma"],
      "interests": ["User Experience", "Component Design", "Mobile-First Development"],
      "compatibility_score": 89,
      "role_suggestion": "Frontend Team Lead"
    }
    // ... other members
  ],
  "team_analysis": {
    "team_strengths": ["Full-stack Coverage", "Clear Role Separation", "Complementary Skills"],
    "potential_gaps": ["Mobile Native Development", "DevOps Automation"],
    "collaboration_potential": "High synergy expected with clear specialization areas",
    "recommendations": ["Add mobile specialist", "Implement code review process"]
  }
}
```

This testing system allows you to:
- ✅ Test real GPT API integration
- ✅ Verify data processing workflow
- ✅ Check UI component rendering
- ✅ Bypass authentication complexity 