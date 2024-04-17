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

import { getUserFragments, postUserTypedFragment, getExpandedUserFragments, postUserSelectedFragment, getFragmentWithId, putUserFragment } from './api';

async function updateUserFragments(user) {
  const userFragments = await getUserFragments(user);
  // To show the fragment of user after login
  document.getElementById('currentFragment').innerText = JSON.stringify(userFragments, null, 4);
}

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

  // Fetch and display the user's fragment
  await updateUserFragments(user);

  // TODO: Later in the course, we will show all the user's fragments in the HTML...   
  // For GET /v1/fragments
  const getFragBtn = document.querySelector('#getFragments');
  getFragBtn.onclick = async () => {
    try {
      let userFrag = await getUserFragments(user);
      document.getElementById('currentFragment').innerText = JSON.stringify(userFrag, null, 4);
      document.getElementById('fragLocation').value = '';
      document.getElementById('currentFragmentWithId').innerText = '';
      document.getElementById('fragmentId').value = '';
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
      document.getElementById('fragLocation').value = '';
      document.getElementById('currentFragmentWithId').innerText = '';
      document.getElementById('fragmentId').value = '';
    } catch (error) {
      console.log("Error fetching the expanded user fragment");
      alert("Something went wrong while fetching the expanded user fragament(s), please try again!")
    }
  }

  // For GET /v1/fragments/:id
  const getFragmentIdBtn = document.querySelector('#getFragmentIdBtn')
  getFragmentIdBtn.onclick = async () => {
    const fragmentId = document.querySelector('#fragmentId');
    const fragmentIdText = fragmentId.value;
    try {
      let userFrag = await getFragmentWithId(user, fragmentIdText);
      document.getElementById('currentFragmentWithId').innerText = JSON.stringify(userFrag, null, 4);
      document.getElementById('fragLocation').value = '';      
    } catch (error) {
      console.log("Error fetching the user fragment data");
      alert("Something went wrong while fetching the user fragament(s) data, please try again!")
    }
  }

  // For POST /v1/fragmens
  const postFragmentBtn = document.querySelector('#postFragmentBtn');
  postFragmentBtn.onclick = async () => {
    const selectedFile = document.querySelector('#selectedFile')
    const fragmentInput = document.querySelector('#fragmentInput');
    const fragType = document.querySelector('#fragmentType').value;
    const fragmentText = fragmentInput.value;

    // To check if the user has typed a fragment or selected from a file  
    if (fragmentText !== '' && fragmentText !== 'Type Something here') {
      try {
        const user = await getUser();
        if (!user) {
          alert('User is not authenticated to post, please Login first!');
          return;
        }
        const fragData = await postUserTypedFragment(user, fragmentText, fragType);
        alert('Fragment created and posted successfully!');
        fragmentInput.value = '';
        await updateUserFragments(user);
        document.getElementById('fragLocation').value = apiUrl + '/' + fragData.location;
      } catch (err) {
        console.error('Error posting fragment: ', err);
        alert('Error posting the typed fragment. Please try again.')
      }
    } 
    // If th user has selected a fragment to post
    else if (selectedFile.files.length > 0) {
      const file = selectedFile.files[0];
      try {
        const user = await getUser();
        if (!user) {
          alert('User is not authenticated to post, please Login first!');
          return;
        }
        const fragData = await postUserSelectedFragment(user, file, fragType);
        alert('Fragment created and posted successfully!');
        await updateUserFragments(user);
        selectedFile.value = '';
        document.getElementById('fragLocation').value = apiUrl + '/' + fragData.location;
      } catch (err) {
        console.error('Error posting fragment: ', err);
        alert('Error posting selected file fragment. Please try again.')
      }
    } else {
      alert('Please select a file to post or type something for the fragment');
    }
  };

  // For PUT /v1/fragments/:id
  const updateFragmentBtn = document.querySelector('#updateFragmentBtn');
  updateFragmentBtn.onclick = async () => {
    const updatedFragId = document.querySelector('#UpdatedFragId');
    const updatedFragData = document.querySelector('#UpdatedFragData');
    // Get the value of Id and Data
    const updatedID = updatedFragId.value 
    const updatedText = updatedFragData.value;
    // To check if a fragment id is entered or not
    if (!updatedID) {
      alert('Please enter a fragment ID to update');
      return;
    }
    // To check if the user is authenticated or not
    try {
      const user = await getUser();
      if (!user) {
        alert('User is not authenticated to post, please Login first!');
        return;
      }
      const fragData = await putUserFragment(user, updatedText, updatedID);
      alert('Fragment updated successfully!');
      updatedFragId.value = '';
      updatedFragData.value = '';
      await updateUserFragments(user);
    } catch (err) {
      console.error('Error updating fragment: ', {err});
      alert('Error updating user fragment. Please try again.')
    }
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
