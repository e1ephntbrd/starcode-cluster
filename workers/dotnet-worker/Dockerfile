FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore "DotNetWorker.csproj"

RUN dotnet publish "DotNetWorker.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
EXPOSE 50052
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "DotNetWorker.dll"]
