/**
 * Manages gRPC client connections to backend worker nodes.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '../proto/constellation.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const credentials = grpc.credentials.createInsecure();
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const constellationProto = protoDescriptor.constellation;

const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'python-worker:50051';
const DOTNET_WORKER_URL = process.env.DOTNET_WORKER_URL || 'dotnet-worker:50052';
const GO_WORKER_URL = process.env.GO_WORKER_URL || 'go-worker:50053';

/**
 * gRPC client instance for the Python computation worker.
 */
export const pythonClient = new constellationProto.StellarDecoder(PYTHON_WORKER_URL, credentials);
export const dotnetClient = new constellationProto.StellarDecoder(DOTNET_WORKER_URL, credentials);
export const goClient = new constellationProto.StellarDecoder(GO_WORKER_URL, credentials);
