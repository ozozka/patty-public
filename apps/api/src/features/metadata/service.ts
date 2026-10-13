import * as repo from "./repository";

export type { Location, SpeciesWithBreeds } from "./repository";

export async function listLocations() {
  return repo.listLocations();
}

export async function listPetTypes() {
  return repo.listPetTypes();
}

export async function resolveLocation(lat: number, lon: number) {
  return repo.resolveLocation(lat, lon);
}
