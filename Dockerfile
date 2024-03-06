# Build and serve fragments-ui with nginx

# ------------------------------------------------------------------- #
# STAGE 0 - Installing the dependencies
# Start Node.js
FROM node:20.11.1-alpine@sha256:c0a3badbd8a0a760de903e00cedbca94588e609299820557e72cba2a53dbaa2c as dependencies

LABEL maintainer="Jeffrey Huynh <jhuynh34@myseneca.ca>"
LABEL description="Fragments node.js microservice"

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

# Explicitly copying the env variables into the nginx image
COPY .env /usr/share/nginx/html

# Using default nginx port 
EXPOSE 80

# Adding Healthcheck to see the statusof the server
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
 CMD curl --fail localhost:80 || exit 1