"""Minimal command-line example showing seed manager usage."""

from protocol import SeedManager


def main():
    mgr = SeedManager()

    seat = input("Enter seat identifier: ")
    try:
        commit = mgr.create_seed(seat)
        print(f"Created commitment: {commit}")
    except ValueError:
        print("Seat already exists; revealing existing seed")
        seed_hex = mgr.reveal_seed(seat)
        print(f"Seed: {seed_hex}")
        print("Verification: ", mgr.verify_commitment(seat, seed_hex))


if __name__ == "__main__":
    main()
