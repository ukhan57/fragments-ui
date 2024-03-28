# Build and serve fragments-ui with nginx

# ------------------------------------------------------------------- #
# STAGE 0 - Installing the dependencies
# Start Node.js
FROM node:20.11.1-alpine@sha256:c0a3badbd8a0a760de903e00cedbca94588e609299820557e72cba2a53dbaa2c as dependencies

LABEL maintainer="Umar Khan <ukhan57@myseneca.ca>"
LABEL description="Fragments-ui Web server"

# fragments microservice API URL (make sure this is the right port for you)
ARG API_URL=http://fragments-lb-1729897819.us-east-1.elb.amazonaws.com

# AWS Amazon Cognito Client App ID (use your Client App ID)
ARG AWS_COGNITO_POOL_ID=us-east-1_8zFUg3al8

# AWS Amazon Cognito Client App ID (use your Client App ID)
ARG AWS_COGNITO_CLIENT_ID=43lnrn9cgf4sd4o71e9p5h34n6

# AWS Amazon Cognito Host UI domain (use your domain only, not the full URL)
ARG AWS_COGNITO_HOSTED_UI_DOMAIN=ukhan-fragments.auth.us-east-1.amazoncognito.com

# OAuth Sign-In Redirect URL (use the port for your fragments-ui web app)
ARG OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:1234

# OAuth Sign-Out Redirect URL (use the port for your fragments-ui web app)
ARG OAUTH_SIGN_OUT_REDIRECT_URL=http://localhost:1234


# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Changing the node env to prod
ENV NODE_ENV=production

# Setting up the working dir
WORKDIR /build

# Copy package.json and package-lock.json
COPY package*.json .

# Clean install the dependencies as production
RUN npm ci --only=production

# ------------------------------------------------------------------- #
# STAGE 1 - Building the site using parcel
# Start Node.js
FROM node:20.11.1-alpine@sha256:c0a3badbd8a0a760de903e00cedbca94588e609299820557e72cba2a53dbaa2c as build

# Setting up the working dir
WORKDIR /build

# Copying the dependencies from the earlier stage
COPY --from=dependencies /build /build

# Copy the source code to the working dir
COPY . .

# Build the site using parcel in the working dir
RUN npx parcel build ./src/index.html --public-url ./

# ------------------------------------------------------------------- #
# STAGE 2 - Hosting the site using nginx
# Start nginx
FROM nginx:1.23.0-alpine@sha256:20a1077e25510e824d6f9ce7af07aa02d86536848ddab3e4ef7d1804608d8125 as deploy

# Copying the build site from the previous stage
COPY --from=build /build/dist /usr/share/nginx/html

# Using default nginx port 
EXPOSE 80

# Adding Healthcheck to see the statusof the server
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
 CMD curl --fail localhost:80 || exit 1
