FROM node:20-alpine AS build
WORKDIR /app

# Only copy package files to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Now copy the rest of the application code
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]