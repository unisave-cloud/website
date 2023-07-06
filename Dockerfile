################
# Node Builder #
################

FROM node:17.7.1-alpine AS builder

WORKDIR /app

# copy source code
COPY ./ ./

# install packages
RUN npm install

# variables used during building
ARG WEBSITE_URL_PREFIX
ENV WEBSITE_URL_PREFIX=${WEBSITE_URL_PREFIX}

# run parcel
RUN npm run build


####################
# Production image #
####################

FROM joseluisq/static-web-server:2.19-alpine

COPY --from=builder /app/dist /public

ENV SERVER_REDIRECT_TRAILING_SLASH=false \
    SERVER_LOG_LEVEL=info

# workdir is /public
# and the exposed port is 80
