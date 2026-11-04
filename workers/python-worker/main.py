"""
Starcode Cluster Python gRPC Worker
Computes spatial matrix transformations and streams spark pulses back to the gateway
"""

import time
import math
import random
from concurrent import futures
import grpc
import numpy as np

# Import generated gRPC stubs
import constellation_pb2
import constellation_pb2_grpc


class StellarDecoderServicer(constellation_pb2_grpc.StellarDecoderServicer):
    """
    Implements the StellarDecoder gRPC service contract.
    """

    def DecodeSector(self, request, context):
        """
        Handles the DecodeSector RPC call by streaming computed node pulses.

        Args:
            request (SectorRequest): Incoming sector decryption payload.
            context (grpc.ServicerContext): gRPC call context.
        """
        sector_id = request.sector_id
        target_nodes = request.target_nodes
        print(f"[Python Worker] Decoding sector {sector_id} with {target_nodes} target nodes...")

        # Generate procedural coordinates using NumPy matrix logic
        angles = np.linspace(0, 2 * np.pi, target_nodes, endpoint=False)
        radii = np.random.uniform(150, 280, target_nodes)

        nodes = []
        for i in range(target_nodes):
            angle = angles[i]
            r = radii[i]
            x = float(r * np.cos(angle))
            y = float(r * np.sin(angle))
            z = float(np.random.uniform(-50, 50))
            nodes.append({"x": x, "y": y, "z": z})

        # Stream each node pulse sequentially with a slight latency simulation
        for i, target_node in enumerate(nodes):
            # Simulate processing time per node
            time.sleep(random.uniform(0.08, 0.18))

            # Build constellation edges (connecting to adjacent nodes)
            next_node = nodes[(i + 1) % len(nodes)]
            edges = [
                constellation_pb2.Vector3D(x=next_node["x"], y=next_node["y"], z=next_node["z"])
            ]

            pulse = constellation_pb2.SparkPulse(
                node_id=f"PY-NODE-{i + 1}",
                worker_language="Python (NumPy)",
                origin=constellation_pb2.Vector3D(x=0.0, y=0.0, z=0.0),
                target=constellation_pb2.Vector3D(
                    x=target_node["x"],
                    y=target_node["y"],
                    z=target_node["z"]
                ),
                latency_ms=round(random.uniform(8.5, 24.2), 2),
                constellation_edges=edges
            )

            print(f"[Python Worker] Streaming pulse -> Node {i + 1}/{target_nodes}")
            yield pulse

        print(f"[Python Worker] Sector {sector_id} decoding completed.")


def serve():
    """
    Initializes and starts the gRPC server instance.
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    constellation_pb2_grpc.add_StellarDecoderServicer_to_server(
        StellarDecoderServicer(), server
    )

    server.add_insecure_port('[::]:50051')
    server.start()
    print("[Python Worker] gRPC server started on port 50051")
    server.wait_for_termination()


if __name__ == '__main__':
    serve()

