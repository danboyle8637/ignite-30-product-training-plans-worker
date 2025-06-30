export const rapidRecoveryData = `
  {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery"] {
      "cardData": {
        "id": _id,
        "slug": slug.current,
        "cardImageUrl": collectionCardImage.mainImage.asset->url,
        "cardImageAltTag": collectionCardImage.imageAltTag,
        "cardImageTitleTag": collectionCardImage.imageTitleTag,
        "cardTitle": title,
        "cardDescription": shortDescription,
      },
      "videoSession": videoCollection[]-> {
        "id": _id,
        "videoType": video.videoType,
        "videoHost": video.videoHost,
        "videoTitle": video.title,
        "videoId": video.videoId,
        "sessionWorkoutDetails": video.videoDiscussion,
      },
      "exercises": exerciseCollection[]-> {
        "id": _id,
        "type": exerciseType,
        "title": title,
        "description": shortDescription,
        "cardImageUrl": exerciseImage.mainImage.asset->url,
        "cardImageAltTag": exerciseImage.imageAltTag,
        "cardImageTitleTag": exerciseImage.imageTitleTag,
        "cardImageWidth": exerciseImage.imageWidth,
        "cardImageHeight": exerciseImage.imageHeight,
        "breakdown": description,
      }
    }
  }
`;

const rapidRecoveryCardsQuery = `
  {
    "rapidRecoveryWeekCardsData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery"] {
        "id": _id,
        "cardImage": collectionCardImage.mainImage.asset->url,
        "cardImageAltTag": collectionCardImage.imageAltTag,
        "cardImageTitleTag": collectionCardImage.imageTitleTag,
        "cardTitle": title,
        "cardDescription": shortDescription,
      }
  }
`;

const rapidRecoveryWeekData = `
  {
    "videoSession": videoCollection[]-> {
      "id": _id,
      "videoType": video.videoType,
      "videoHost": video.videoHost,
      "videoTitle": video.title,
      "videoId": video.videoId,
      "sessionWorkoutDetails": video.videoDiscussion,
    },
    "exercises": exerciseCollection[]-> {
      "id": _id,
      "type": exerciseType,
      "title": title,
      "description": shortDescription,
      "cardImage": exerciseImage.mainImage.asset->url,
      "cardImageAltTag": exerciseImage.imageAltTag,
      "cardImageTitleTag": exerciseImage.imageTitleTag,
      "cardImageWidth": exerciseImage.imageWidth,
      "cardImageHeight": exerciseImage.imageHeight,
      "breakdown": description,
    }
  }
`;

const rapidRecoveryExerciseCardsQuery = `
  {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery" && 
      _id == '27b932b6-12db-4907-82e8-d46b0d9dcbdd'] {
        "exercises": exerciseCollection[]-> {
          "id": _id,
          "type": exerciseType,
          "title": title,
          "description": shortDescription,
          "cardImage": exerciseImage.mainImage.asset->url,
          "cardImageAltTag": exerciseImage.imageAltTag,
          "cardImageTitleTag": exerciseImage.imageTitleTag,
          "cardImageWidth": exerciseImage.imageWidth,
          "cardImageHeight": exerciseImage.imageHeight,
        }
      }
  }
`;

const rapidRecoveryVideoAndWorkoutQuery = `
  {
    "rapidRecoveryWeekData": *[
      _type == "collection" && 
      program -> programId == "rapid_recovery" && 
      _id == '27b932b6-12db-4907-82e8-d46b0d9dcbdd'] {
        "videoSession": videoCollection[]-> {
          "id": _id,
          "videoType": video.videoType,
          "videoHost": video.videoHost,
          "videoTitle": video.title,
          "videoId": video.videoId,
          "sessionWorkoutDetails": video.videoDiscussion,
        }
      }
  }
`;
