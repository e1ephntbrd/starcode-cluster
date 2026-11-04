FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o go-worker main.go

FROM alpine:3.19
WORKDIR /app

COPY --from=builder /app/go-worker .

EXPOSE 50053

CMD ["./go-worker"]
