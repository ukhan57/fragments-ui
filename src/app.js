// src/app.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
// const apiUrl = process.env.API_URL || 'http://localhost:8080/';
let apiUrl;
if (process.env.API_URL) {
  apiUrl = process.env.API_URL;
} else {
  apiUrl = 'http://localhost:8080';
}

import { Auth, getUser } from './auth';

// Modifications to src/app.js

import { getUserFragments, postUserFragment, getExpandedUserFragments } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  let userFragments = await getUserFragments(user);

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Print the currnt fragment for the user
  document.getElementById('currentFragment').innerText = JSON.stringify(userFragments, null, 4);

  // Disable the Login button
  loginBtn.disabled = true; 

  // TODO: Later in the course, we will show all the user's fragments in the HTML...   
  // For GET /v1/fragments
  const getFragBtn = document.querySelector('#getFragments');
  getFragBtn.onclick = async () => {
    try {
      let userFrag = await getUserFragments(user);
      document.getElementById('currentFragment').innerText = JSON.stringify(userFrag, null, 4);
    } catch (error) {
      console.log("Error fetching the user fragment.");
      alert("Something went wrong while fetching the user fragament(s), please try again!")
    }
  };

  // For GET /v1/fragments?expand=1
  const getExpandFragBtn = document.querySelector('#getExpandedFragments');
  getExpandFragBtn.onclick = async () => {
    try {
      let userFrag = await getExpandedUserFragments(user, 1);
      document.getElementById('currentFragment').innerText = JSON.stringify(userFrag, null, 4);
    } catch (error) {
      console.log("Error fetching the expanded user fragment");
      alert("Something went wrong while fetching the expanded user fragament(s), please try again!")
    }
  }

  // For POST /v1/fragmens
  const postFragmentBtn = document.querySelector('#postFragmentBtn');
  postFragmentBtn.onclick = async () => {
    const fragmentInput = document.querySelector('#fragmentInput');
    const fragmentText = fragmentInput.value;
    if (fragmentText.trim() == '') {
      alert('Please enter some text for the fragment');
      return;
    }
    const user = await getUser();
    if (!user) {
      alert('User is not authenticated to post, please Login first!');
      return;
    }
    try {
      await postUserFragment(user, fragmentText);
      alert('Fragment created and posted successfully!');
    } catch (error) {
      console.error('Error posting fragment: ', error);
      alert('Error posting fragment. Please try again.');
    }
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
