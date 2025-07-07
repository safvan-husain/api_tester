import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from './request.service';
import { getModelToken } from '@nestjs/mongoose'; // Changed
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

// Mock Typegoose model
const mockRequestModel = {
  new: jest.fn().mockImplementation(dto => ({ ...dto, save: jest.fn().mockResolvedValue({ _id: 'mockId', ...dto }) })),
  constructor: jest.fn().mockImplementation(dto => ({ ...dto, save: jest.fn().mockResolvedValue({ _id: 'mockId', ...dto }) })),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  exec: jest.fn(), // For chaining .exec()
};

describe('RequestService', () => {
  let service: RequestService;
  let model: Model<Request>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: getModelToken(Request.name),
          useValue: mockRequestModel,
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    model = module.get<Model<Request>>(getModelToken(Request.name));
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new request', async () => {
      const createRequestDto: CreateRequestDto = {
        url: 'http://example.com',
        method: 'GET',
      };
      const expectedResult = { _id: 'mockId', ...createRequestDto, unsaved: true };

      // Mock the save method on the instance returned by 'new this.requestModel()'
      const saveMock = jest.fn().mockResolvedValue(expectedResult);
      (mockRequestModel.new as jest.Mock).mockImplementation(() => ({ save: saveMock, ...createRequestDto, unsaved: true }));

      const result = await service.create(createRequestDto);

      expect(mockRequestModel.new).toHaveBeenCalledWith(createRequestDto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of requests', async () => {
      const expectedRequests = [{ _id: '1', url: 'http://example.com', method: 'GET', unsaved: true }];
      (mockRequestModel.find as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(expectedRequests) });

      const result = await service.findAll();
      expect(mockRequestModel.find).toHaveBeenCalled();
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('findOne', () => {
    it('should return a single request if found', async () => {
      const expectedRequest = { _id: '1', url: 'http://example.com', method: 'GET', unsaved: true };
      (mockRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(expectedRequest) });

      const result = await service.findOne('1');
      expect(mockRequestModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedRequest);
    });

    it('should throw NotFoundException if request is not found', async () => {
      (mockRequestModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a request and set unsaved to true', async () => {
      const updateRequestDto: UpdateRequestDto = { url: 'http://newexample.com' };
      const expectedUpdatedRequest = { _id: '1', url: 'http://newexample.com', method: 'GET', unsaved: true };
      (mockRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(expectedUpdatedRequest) });

      const result = await service.update('1', updateRequestDto);

      expect(mockRequestModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { ...updateRequestDto, unsaved: true }, { new: true });
      expect(result).toEqual(expectedUpdatedRequest);
    });

    it('should throw NotFoundException if request to update is not found', async () => {
      (mockRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a request and return success', async () => {
      (mockRequestModel.deleteOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });

      const result = await service.remove('1');
      expect(mockRequestModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
      expect(result).toEqual({ deleted: true, id: '1' });
    });

    it('should throw NotFoundException if request to delete is not found', async () => {
      (mockRequestModel.deleteOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 0 }) });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setUnsavedStatus', () => {
    it('should update the unsaved status of a request', async () => {
      const expectedRequest = { _id: '1', url: 'http://example.com', method: 'GET', unsaved: false };
      (mockRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(expectedRequest) });

      const result = await service.setUnsavedStatus('1', false);

      expect(mockRequestModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { unsaved: false }, { new: true });
      expect(result).toEqual(expectedRequest);
    });

    it('should throw NotFoundException if request to update status is not found', async () => {
      (mockRequestModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.setUnsavedStatus('1', false)).rejects.toThrow(NotFoundException);
    });
  });
});
