/**
 * Go gRPC Starcode Cluster Worker
 * Validates graph structures and streams structural closure pulses
 */

package main

import (
	"fmt"
	"log"
	"math"
	"math/rand"
	"net"
	"time"

	"google.golang.org/grpc"

	pb "go-worker/proto"
)

type NodeCoords struct {
    X, Y, Z float32
}

// server implements pb.StellarDecoderServer.
type server struct {
	pb.UnimplementedStellarDecoderServer
}

// DecodeSector streams validation and closure pulses for the target sector.
func (s *server) DecodeSector(req *pb.SectorRequest, stream pb.StellarDecoder_DecodeSectorServer) error {
	log.Printf("[Go Worker] Validating graph cluster for sector %s (Target nodes: %d)", req.SectorId, req.TargetNodes)

	nodeCount := req.TargetNodes
	if nodeCount <= 0 {
		nodeCount = 10
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	nodes := make([]NodeCoords, nodeCount)
	for i := int32(0); i < nodeCount; i++ {
		angle := (float64(i) / float64(nodeCount)) * 2 * math.Pi
		radius := 150.0 + rng.Float64()*130.0

		nodes[i] = NodeCoords{
			X: float32(radius * math.Cos(angle)),
			Y: float32(radius * math.Sin(angle)),
			Z: float32(rng.Float64()*100 - 50),
		}
	}

	for i := int32(0); i < nodeCount; i++ {
		time.Sleep(time.Duration(rng.Intn(100)+70) * time.Millisecond)

		currentNode := nodes[i]

		nextNode := nodes[(i+1)%nodeCount]

		pulse := &pb.SparkPulse{
			NodeId:         fmt.Sprintf("GO-NODE-%d", i+1),
			WorkerLanguage: "Go (Golang)",
			Origin: &pb.Vector3D{
				X: 0.0,
				Y: 0.0,
				Z: 0.0,
			},
			Target: &pb.Vector3D{
				X: currentNode.X,
				Y: currentNode.Y,
				Z: currentNode.Z,
			},
			LatencyMs: float32(rng.Intn(8)+3) + rng.Float32(),
			ConstellationEdges: []*pb.Vector3D{
				{
					X: nextNode.X,
					Y: nextNode.Y,
					Z: nextNode.Z,
				},
			},
		}

		log.Printf("[Go Worker] Streaming graph pulse -> Node %d/%d", i+1, nodeCount)
		if err := stream.Send(pulse); err != nil {
			log.Printf("[Go Worker] Error sending stream: %v", err)
			return err
		}
	}

	log.Printf("[Go Worker] Sector %s graph validation completed successfully.", req.SectorId)
	return nil
}

func main() {
	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		log.Fatalf("Failed to listen on port 50053: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterStellarDecoderServer(s, &server{})

	log.Println("[Go Worker] gRPC server started on port 50053")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
