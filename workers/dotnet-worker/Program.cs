using DotNetWorker.Services;

var builder = WebApplication.CreateBuilder(args);

// Add gRPC services to the container
builder.Services.AddGrpc();

// Bind to port 50052 for cluster communication
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(50052, o => o.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2);
});

var app = builder.Build();

// Configure the HTTP request pipeline to map the gRPC service
app.MapGrpcService<StellarService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/linkid4linkid2linkid3linkid4linkid2linkid3");

app.Run();
