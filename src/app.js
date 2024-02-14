// src/app.js

import { Auth, getUser } from './auth';

// Modifications to src/app.js

import { getUserFragments, postUserFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');

  // For post request
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

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  // Do an authenticated request to the fragments API server and log the result
  const userFragments = await getUserFragments(user);  

  // TODO: Later in the course, we will show all the user's fragments in the HTML...   
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);