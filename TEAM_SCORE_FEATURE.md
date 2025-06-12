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