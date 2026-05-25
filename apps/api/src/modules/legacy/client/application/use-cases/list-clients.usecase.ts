import { ClientRepository } from "../ports/client-repository.port";

type Input = {
  page: number;
  pageSize: number;
  q?: string;
};

export class ListClientsUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: Input) {
    return this.clientRepository.list(input);
  }
}