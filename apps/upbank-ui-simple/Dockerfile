FROM node:20-alpine AS build
WORKDIR /app

# Only copy package files to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Now copy the rest of the application code
COPY . .
# During container builds, use runtime JSON config (VITE_USE_ENV_CONFIG=false)
ENV VITE_USE_ENV_CONFIG=false

RUN npm run build

FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your SPA config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
