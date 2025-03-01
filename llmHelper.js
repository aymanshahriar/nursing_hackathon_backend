import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { db } from "./src/utils/databaseConnection.js";
import { OPENAI_API_KEY, GEMINI_API_KEY } from "../config/environmentVariables.js";



// SR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIX
const bioAttributes = [
  "date_of_birth",
  "condition",
  "hobbies",
  "about",
  "role"
];
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Function to fetch user data from usertable and bio table using callbacks ////////////////////////////// MIGHT NEED TO CHANGE THE QUERY
const fetchUsersData = async () => {
  try {
    const query = `
      SELECT User.id as UserId, ${bioAttributes
        .map((attr) => `User.${attr}`)
        .join(", ")}, 
        COUNT(User_match.peer_supporter_id) AS number_of_matches
      FROM User
      LEFT JOIN User_match ON User.id = User_match.peer_supporter_id
      WHERE User.id NOT IN (
        SELECT User_match.patient_id
        FROM User_match
        WHERE User_match.still_matched IS TRUE
      )
      GROUP BY User.id;
    `;

    const [results] = await db.execute(query);

    return results.map((row) => ({
      userId: row.UserId,
      bioAttributes: bioAttributes.reduce((acc, attr) => {
        acc[attr] = row[attr];
        return acc;
      }, {}),
    }));
  } catch (err) {
    console.error("Error fetching user data:", err);
    throw err;
  }
};




// SR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIXSR FIX
// MIGHT BE ABLE TO HAVE MULTIPLE PATIENTS PER PEER SUPPORTER
// Function to send user data to ChatGPT API and get matches
const matchUsersOpenAI = async (usersData) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // or gpt-4 if you are using it
        messages: [
          {
            role: "system",
            content:
              "You are a matching expert. Match users of role 'patient' with users of role 'peer_supporter' based on 'condition', 'date_of_birth', 'hobbies' and 'about'", //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE 
          },
          {
            role: "user",
            content: `Here is the user data: ${JSON.stringify(
              usersData
            )}. Attempt to make it so that the sum of 'number_of_matches' plus the quantity of matches you assign for each user of role 'peer_supporter' is below 6.`, //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE 
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`, // Use your OpenAI API key here
          "Content-Type": "application/json",
        },
      }
    );
    // Return the response from ChatGPT
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error calling OpenAI API:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to match users");
  }
};




// WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASE WE USE GEMENI PLEASEWE USE GEMENI PLEASE WE USE GEMENI PLEASE
// Function to send user data to Gemini API and get matches
const matchUsersGemini = async (usersData) => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Here is the user data: ${JSON.stringify(
      usersData
    )}. For each user of role 'patient' please provide a matches with a user of role 'peer_supporter'. Base the matches on 'condition', 'date_of_birth', 'hobbies' and 'about'". Attempt to make it so that the sum of 'number_of_matches' plus the quantity of matches you assign for each user of role 'peer_supporter' is below 6. Return the matches in strict JSON format with the following structure: {"matches": [{"patient_id": <patient_id>, "peer_supporter_id": <peer_supporter_id>}]}. Ensure that each User of role 'patient' appears only once in the matches.`; //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE //SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE SR HERE 

    const result = await model.generateContent(prompt);

    // Ensure the response is valid JSON
    let jsonResponse = result.response.text();

    // Remove the ```json and ``` markers and trim whitespace
    jsonResponse = jsonResponse.replace(/```json|```/g, "").trim();

    // Additional cleanup to ensure valid JSON
    jsonResponse = jsonResponse
      .replace(/^[^{[]+/, "")
      .replace(/[^}\]]+$/, "")
      .trim();

    const matches = JSON.parse(jsonResponse).matches;
    const bestMatches = [];
    const matchedUsers = new Set();

    // Find the best match for each user based on the rating
    matches.sort((a, b) => b.rating - a.rating);
    matches.forEach((match) => {
      if (
        !matchedUsers.has(match.userId) &&
        !matchedUsers.has(match.matchUserId)
      ) {
        const existingMatchIndex = bestMatches.findIndex(
          (m) => m.userId === match.userId
        );
        if (
          existingMatchIndex === -1 ||
          bestMatches[existingMatchIndex].rating < match.rating
        ) {
          if (existingMatchIndex !== -1) {
            matchedUsers.delete(bestMatches[existingMatchIndex].matchUserId);
            bestMatches.splice(existingMatchIndex, 1);
          }
          bestMatches.push(match);
          matchedUsers.add(match.userId);
          matchedUsers.add(match.matchUserId);
        }
      }
    });
    return { matches: bestMatches };
  } catch (error) {
    console.error(
      "Error calling Gemini API:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to match users with Gemini");
  }
};





// Function to match users using OpenAI, with Gemini as a fallback
const matchUsers = async () => {
  try {
    const usersData = await fetchUsersData();
    if (usersData.length <= 1) return;

    return await matchUsersOpenAI(usersData);
  } catch (error) {
    console.log("Falling back to Gemini API");
    try {
      const usersData = await fetchUsersData();
      if (usersData.length <= 1) return;

      return await matchUsersGemini(usersData);
    } catch (err) {
      console.error("Error fetching user data for Gemini API:", err);
      throw err;
    }
  }
};

const getCurrentDateTimeAsString = () => {
  var dateTime = new Date();
  var utcOffset = "+00:00";
  dateTime =
    dateTime.getUTCFullYear() +
    "-" +
    ("00" + (dateTime.getUTCMonth() + 1)).slice(-2) +
    "-" +
    ("00" + dateTime.getUTCDate()).slice(-2) +
    " " +
    ("00" + dateTime.getUTCHours()).slice(-2) +
    ":" +
    ("00" + dateTime.getUTCMinutes()).slice(-2) +
    ":" +
    ("00" + dateTime.getUTCSeconds()).slice(-2) +
    utcOffset;
  return dateTime;
};

// Function to insert matches into the database
const insertMatchesIntoDB = async (matches) => {
  try {
    const insertQuery = `INSERT INTO user_match (patient_id, peer_supporter_id, match_time, still_matched) VALUES (?, ?, ?, ?)`;
    const currentTime = getCurrentDateTimeAsString();

    const insertPromises = matches.flatMap((match) => [
      db.execute(insertQuery, [match.userId, match.matchUserId, currentTime, true]),
      db.execute(insertQuery, [match.matchUserId, match.userId, currentTime, match.reason]),
    ]);

    await Promise.all(insertPromises);
  } catch (error) {
    console.error("Error inserting matches into DB:", error);
    throw error;
  }
};

// Call the matchUsers function and then insert the matches into the database
const processMatches = async () => {
  try {
    const matches = await matchUsers();
    // Extract the matches array from the JSON object
    if (!matches || !matches.matches) {
      console.log("No matches found");
      return;
    }
    const matchesArray = matches.matches;
    // Ensure matchesArray is an array
    if (!Array.isArray(matchesArray)) {
      throw new TypeError("matches is not iterable");
    }
    // Call the function with the extracted array
    await insertMatchesIntoDB(matchesArray);
  } catch (err) {
    console.error("Error inserting matches:", err);
  }
};

export {matchUsersGemini};
export default processMatches;