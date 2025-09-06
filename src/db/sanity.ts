export const programOverviewQuery = `
  {
    "overviewData": *[_type == 'trainingPlanOverview' && programId->programId == $programId][0] {
      "id": _id,
      "title": title,
      "programId": programId->programId,
      "description": description
    }
  }
`;

export const dailyGoalsDetailsQuery = `
  {
    "workoutData": *[_type == $programId && trainingPlanDay == $trainingPlanDay][0] {
      "id": _id,
      "primaryGoal": {
        "goalLink": primaryGoal.goalLink,
        "title": primaryGoal.title,
        "tags": primaryGoal.tags[]->{_id, title, tagColor},
        "isFoundationWorkout": primaryGoal.isFoundationWorkout,
        "isDrillWorkout": primaryGoal.isDrillWorkout,
        "goalDetails": primaryGoal.goalDetails,
        "videoId": primaryGoal.videoEmbed.videoId,
      },
      "busyGoal": {
        "goalLink": busyGoal.goalLink,
        "title": busyGoal.title,
        "tags": busyGoal.tags[]->{_id, title, tagColor},
        "isFoundationWorkout": busyGoal.isFoundationWorkout,
        "isDrillWorkout": busyGoal.isDrillWorkout,
        "goalDetails": busyGoal.goalDetails,
        "videoId": primaryGoal.videoEmbed.videoId,
      },
      "motivationGoal": {
        "goalLink": motivationGoal.goalLink,
        "title": motivationGoal.title,
        "goalDetails": motivationGoal.goalDetails,
        "videoId": primaryGoal.videoEmbed.videoId,
      },
      "coachingGoal": {
        "goalLink": coachingGoal.goalLink,
        "title": coachingGoal.title,
        "goalDetails": coachingGoal.goalDetails,
        "videoId": primaryGoal.videoEmbed.videoId,
      }
    }
  }
`;
