FROM node:20-alpine AS build

RUN apk add --no-cache bash curl

WORKDIR /app

COPY . .

RUN ./scripts/setup-monaco.sh && ./scripts/setup-fengari.sh
RUN rm -rf node_modules

FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Under the path the workshop platform embeds it at; docker/nginx.conf serves
# it there and redirects any other version to it.
COPY --from=build /app /usr/share/nginx/html/runtime/pacman/latest

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
