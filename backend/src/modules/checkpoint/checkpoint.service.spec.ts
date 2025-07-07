import { Test, TestingModule } from '@nestjs/testing';
import { CheckpointService } from './checkpoint.service';
import { RequestService } from '../request/request.service';
import { getModelToken } from '@nestjs/mongoose'; // Changed
import { Checkpoint } from './entities/checkpoint.entity';
import { Request as ApiRequest } from '../request/entities/request.entity';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Model, Types } from 'mongoose'; // Import Types for ObjectId

// Mock Models
const mockCheckpointModel = {
  new: jest.fn().mockImplementation(dto => ({ ...dto, save: jest.fn().mockResolvedValue({ _id: 'cpMockId', ...dto }) })),
  constructor: jest.fn().mockImplementation(dto => ({ ...dto, save: jest.fn().mockResolvedValue({ _id: 'cpMockId', ...dto }) })),
  find: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
};

const mockApiRequestModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

// Mock RequestService
const mockRequestService = {
  setUnsavedStatus: jest.fn(),
};

describe('CheckpointService', () => {
  let service: CheckpointService;
  let checkpointModel: Model<Checkpoint>;
  let apiRequestModel: Model<ApiRequest>;
  let requestService: RequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointService,
        { provide: getModelToken(Checkpoint.name), useValue: mockCheckpointModel },
        { provide: getModelToken(ApiRequest.name), useValue: mockApiRequestModel },
        { provide: RequestService, useValue: mockRequestService },
      ],
    }).compile();

    service = module.get<CheckpointService>(CheckpointService);
    checkpointModel = module.get<Model<Checkpoint>>(getModelToken(Checkpoint.name));
    apiRequestModel = module.get<Model<ApiRequest>>(getModelToken(ApiRequest.name));
    requestService = module.get<RequestService>(RequestService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCheckpointDto: CreateCheckpointDto = {
      requestId: new Types.ObjectId().toHexString(), // Use valid ObjectId string
      name: 'Test Checkpoint',
    };
    const mockApiRequest = {
      _id: createCheckpointDto.requestId,
      url: 'http://example.com',
      method: 'GET',
      headers: {},
      body: {},
      unsaved: true,
    };

    it('should create a checkpoint and set request unsaved to false', async () => {
      (mockApiRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockApiRequest) });
      const saveMock = jest.fn().mockResolvedValue({ _id: 'cpMockId', ...createCheckpointDto, data: { url: 'http://example.com', method: 'GET' } });
      (mockCheckpointModel.new as jest.Mock).mockImplementation(() => ({ save: saveMock }));
      (requestService.setUnsavedStatus as jest.Mock).mockResolvedValue({ ...mockApiRequest, unsaved: false });

      const result = await service.create(createCheckpointDto);

      expect(mockApiRequestModel.findById).toHaveBeenCalledWith(createCheckpointDto.requestId);
      expect(mockCheckpointModel.new).toHaveBeenCalledWith(expect.objectContaining({
        requestId: createCheckpointDto.requestId,
        name: createCheckpointDto.name,
        data: {
          url: mockApiRequest.url,
          method: mockApiRequest.method,
          headers: mockApiRequest.headers,
          body: mockApiRequest.body,
        },
      }));
      expect(saveMock).toHaveBeenCalled();
      expect(requestService.setUnsavedStatus).toHaveBeenCalledWith(createCheckpointDto.requestId, false);
      expect(result).toHaveProperty('_id');
      expect(result.name).toBe(createCheckpointDto.name);
    });

    it('should throw NotFoundException if request to checkpoint is not found', async () => {
      (mockApiRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.create(createCheckpointDto)).rejects.toThrow(NotFoundException);
    });

    it('should log a warning if setting unsaved status fails but still return checkpoint', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (mockApiRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockApiRequest) });
      const saveMock = jest.fn().mockResolvedValue({ _id: 'cpMockId', ...createCheckpointDto, data: { url: 'http://example.com', method: 'GET' } });
      (mockCheckpointModel.new as jest.Mock).mockImplementation(() => ({ save: saveMock }));
      (requestService.setUnsavedStatus as jest.Mock).mockRejectedValue(new Error("Failed to update"));

      const result = await service.create(createCheckpointDto);

      expect(result).toHaveProperty('_id');
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('findAllForRequest', () => {
    const requestId = new Types.ObjectId().toHexString();
    it('should return checkpoints for a given request ID', async () => {
      const expectedCheckpoints = [{ _id: 'cp1', requestId }];
      (mockApiRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: requestId }) }); // Mock request exists
      (mockCheckpointModel.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(expectedCheckpoints) });

      const result = await service.findAllForRequest(requestId);
      expect(mockCheckpointModel.find).toHaveBeenCalledWith({ requestId });
      expect(result).toEqual(expectedCheckpoints);
    });

    it('should throw NotFoundException if request not found when finding checkpoints', async () => {
      (mockApiRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findAllForRequest(requestId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rollback', () => {
    const checkpointId = new Types.ObjectId().toHexString();
    const requestId = new Types.ObjectId().toHexString();
    const mockCheckpoint = {
      _id: checkpointId,
      requestId: requestId,
      data: { url: 'http://rolledback.com', method: 'POST', headers: { auth: 'bearer' }, body: { key: 'value' } },
    };
    const expectedRolledBackRequest = { _id: requestId, ...mockCheckpoint.data, unsaved: true };

    it('should rollback request to checkpoint data and set unsaved to true', async () => {
      (mockCheckpointModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCheckpoint) });
      (mockApiRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(expectedRolledBackRequest) });

      const result = await service.rollback(checkpointId);

      expect(mockCheckpointModel.findById).toHaveBeenCalledWith(checkpointId);
      expect(mockApiRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(
        requestId,
        { ...mockCheckpoint.data, unsaved: true },
        { new: true },
      );
      expect(result).toEqual(expectedRolledBackRequest);
    });

    it('should throw NotFoundException if checkpoint is not found', async () => {
      (mockCheckpointModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.rollback(checkpointId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if request update fails during rollback', async () => {
      (mockCheckpointModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCheckpoint) });
      (mockApiRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.rollback(checkpointId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete a checkpoint and return success', async () => {
      (mockCheckpointModel.deleteOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });

      const result = await service.remove('cp1');
      expect(mockCheckpointModel.deleteOne).toHaveBeenCalledWith({ _id: 'cp1' });
      expect(result).toEqual({ deleted: true, id: 'cp1' });
    });

    it('should throw NotFoundException if checkpoint to delete is not found', async () => {
      (mockCheckpointModel.deleteOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 0 }) });

      await expect(service.remove('cp1')).rejects.toThrow(NotFoundException);
    });
  });
});
