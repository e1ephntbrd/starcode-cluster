using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace DotNetWorker.Services;

/// <summary>
/// Implements the StellarDecoder gRPC service for vector noise generation.
/// </summary>
public class StellarService : Constellation.StellarDecoder.StellarDecoderBase
{
    private readonly ILogger<StellarService> _logger;
    private readonly Random _random = new();

    public StellarService(ILogger<StellarService> logger)
    {
        _logger = logger;
    }

    public override async Task DecodeSector(
        Constellation.SectorRequest request,
        IServerStreamWriter<Constellation.SparkPulse> responseStream,
        ServerCallContext context)
    {
        _logger.LogInformation("Decoding sector {SectorId} with target nodes {TargetNodes} via .NET Worker",
            request.SectorId, request.TargetNodes);

        int nodeCount = Math.Max(request.TargetNodes, 8);

        var nodes = new List<(float X, float Y, float Z)>(nodeCount);
        for (int i = 0; i < nodeCount; i++)
        {
            double angle = (i / (double)nodeCount) * Math.PI * 2;
            float distance = (float)(150 + _random.NextDouble() * 130);

            float x = (float)(Math.Cos(angle) * distance);
            float y = (float)(Math.Sin(angle) * distance);
            float z = (float)(_random.NextDouble() * 100 - 50); // Від -50 до 50

            nodes.Add((x, y, z));
        }

        for (int i = 0; i < nodeCount; i++)
        {
            if (context.CancellationToken.IsCancellationRequested) break;

            await Task.Delay(_random.Next(80, 180));

            var currentNode = nodes[i];
            var nextNode = nodes[(i + 1) % nodeCount];

            var edge = new Constellation.Vector3D
            {
                X = nextNode.X,
                Y = nextNode.Y,
                Z = nextNode.Z
            };

            var pulse = new Constellation.SparkPulse
            {
                NodeId = $"NET-NODE-{i + 1}",
                WorkerLanguage = ".NET 8 (C#)",
                Origin = new Constellation.Vector3D { X = 0, Y = 0, Z = 0 },
                Target = new Constellation.Vector3D { X = currentNode.X, Y = currentNode.Y, Z = currentNode.Z },
                LatencyMs = (float)Math.Round(_random.NextDouble() * 12 + 6, 2),
                ConstellationEdges = { edge }
            };

            _logger.LogInformation("Streaming .NET pulse -> Node {Index}/{Total}", i + 1, nodeCount);
            await responseStream.WriteAsync(pulse);
        }

        _logger.LogInformation("Sector {SectorId} processing completed by .NET Worker.", request.SectorId);
    }
}
