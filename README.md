# chatwise-searxng-bridge

## To run

```bash
bun run server.ts
```

## To run with docker

`compose.yaml`

```yaml
services:
  chatwise-searxng:
    image: arnochen/chatwise-searxng:latest
    restart: always
    ports:
      - 3000:3000
    environment:
      - SEARXNG_URL=http://your-searxng-host:8080
      - SEARXNG_CUSTOM_PARAMS=&format=json&safesearch=0
      - SEARXNG_PREFERENCES=
```

## [Config in ChatWise](https://docs.chatwise.app/web-search.html#search-provider)

Set URL of the custom search provider to `http://your-chatwise-searxng-bridge-host:3000/search`
