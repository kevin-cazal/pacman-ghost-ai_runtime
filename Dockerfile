FROM node:20-alpine AS build

RUN apk add --no-cache bash curl

WORKDIR /app

COPY . .

RUN ./scripts/setup-monaco.sh && ./scripts/setup-fengari.sh
RUN rm -rf node_modules

FROM nginx:alpine

COPY --from=build /app /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
