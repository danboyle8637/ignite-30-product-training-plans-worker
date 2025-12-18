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
        "videoId": busyGoal.videoEmbed.videoId,
      },
      "motivationGoal": {
        "goalLink": motivationGoal.goalLink,
        "title": motivationGoal.title,
        "goalDetails": motivationGoal.goalDetails,
        "videoId": motivationGoal.videoEmbed.videoId,
      },
      "coachingGoal": {
        "goalLink": coachingGoal.goalLink,
        "title": coachingGoal.title,
        "goalDetails": coachingGoal.goalDetails,
        "videoId": coachingGoal.videoEmbed.videoId,
      }
    }
  }
`;

export const getWorkoutListQuery = `
	{
    "workoutListData": *[_type == $programId] | order(trainingPlanDay asc) {
  		"trainingPlanDay": trainingPlanDay,
      defined(primaryGoal.videoEmbed.videoId) => {
        "primaryGoal": {
          "videoId": primaryGoal.videoEmbed.videoId,
          "goalDetails": primaryGoal.goalDetails,
          "title": primaryGoal.title,
          "isFoundationWorkout": primaryGoal.isFoundationWorkout,
          "isDrillWorkout": primaryGoal.isDrillWorkout,
        }
      },
      defined(busyGoal.videoEmbed.videoId) => {
        "busyGoal": {
          "title": busyGoal.title,
          "isFoundationWorkout": busyGoal.isFoundationWorkout,
          "isDrillWorkout": busyGoal.isDrillWorkout,
          "goalDetails": busyGoal.goalDetails,
          "videoId": busyGoal.videoEmbed.videoId
        }
      },
      defined(motivationGoal.videoEmbed.videoId) => {
        "motivationGoal": {
          "title": motivationGoal.title,
          "goalDetails": motivationGoal.goalDetails,
          "videoId": motivationGoal.videoEmbed.videoId
        }
      },
      defined(coachingGoal.videoEmbed.videoId) => {
        "coachingGoal": {
          "title": coachingGoal.title,
          "goalDetails": coachingGoal.goalDetails,
          "videoId": coachingGoal.videoEmbed.videoId
        }
      }
    }
  }
`;
