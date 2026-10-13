/** Service for pet-related API calls. */
import type {
  Pet,
  PetPhoto,
  PetRequest,
  SpeciesWithBreeds,
} from '@patty/contracts';
import {
  petPhotoSchema,
  petSchema,
  speciesWithBreedsSchema,
} from '@patty/contracts';
import { apiClient } from 'src/api/client';
import { z } from 'zod';

import { BaseService } from './BaseService';

export class PetService extends BaseService {
  /**
   * Create a new pet.
   */
  static async createPet(data: PetRequest): Promise<Pet> {
    const response = await apiClient.api.v1.pets.$post({
      json: data,
    });
    return this.handle(response, petSchema);
  }

  /**
   * Update an existing pet.
   */
  static async updatePet(id: string, data: PetRequest): Promise<void> {
    const response = await apiClient.api.v1.pets[':id'].$put({
      param: { id },
      json: data,
    });
    return this.handle(response);
  }

  /**
   * Delete a pet.
   */
  static async deletePet(id: string): Promise<void> {
    const response = await apiClient.api.v1.pets[':id'].$delete({
      param: { id },
    });
    return this.handle(response);
  }

  /**
   * Get all pet types (species and breeds).
   */
  static async getPetTypes(): Promise<SpeciesWithBreeds[]> {
    const response = await apiClient.api.v1.metadata['pet-types'].$get();
    return this.handle(response, z.array(speciesWithBreedsSchema));
  }

  /**
   * Add a photo to a pet.
   */
  static async addPhoto(petId: string, imageUrl: string): Promise<PetPhoto> {
    const response = await apiClient.api.v1.pets[':id'].photos.$post({
      param: { id: petId },
      json: { image_url: imageUrl },
    });
    return this.handle(response, petPhotoSchema);
  }

  /**
   * Remove a photo from a pet.
   */
  static async removePhoto(petId: string, photoId: string): Promise<void> {
    const response = await apiClient.api.v1.pets[':id'].photos[
      ':photo_id'
    ].$delete({
      param: { id: petId, photo_id: photoId },
    });
    return this.handle(response);
  }

  /**
   * Update the display order of pet photos.
   */
  static async reorderPhotos(
    petId: string,
    orderedPhotoIds: string[],
  ): Promise<void> {
    const response = await apiClient.api.v1.pets[':id'].photos.order.$put({
      param: { id: petId },
      json: { ordered_photo_ids: orderedPhotoIds },
    });
    return this.handle(response);
  }

  /**
   * Get soft-deleted pets.
   */
  static async getDeletedPets(): Promise<Pet[]> {
    const response = await apiClient.api.v1.pets.deleted.$get();
    return this.handle(response, z.array(petSchema));
  }

  /**
   * Restore a soft-deleted pet.
   */
  static async restorePet(id: string): Promise<void> {
    const response = await apiClient.api.v1.pets[':id'].restore.$post({
      param: { id },
    });
    return this.handle(response);
  }
}
