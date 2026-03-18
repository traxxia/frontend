# ------------ Stage 1: Build React App ------------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ------------ Stage 2: Serve with NGINX ------------
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom NGINX config to handle React Router and ports properly
COPY nginx/nginx.conf /etc/nginx/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]