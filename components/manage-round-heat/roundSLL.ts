import RoundNode from "@/components/manage-round-heat/roundNode";

export class SinglyLinkedList<T> {
  private head: RoundNode<T> | null = null;
  private tail: RoundNode<T> | null = null;

  // For conditional render check about what to display
  public isEmpty(): boolean {
    return this.head === null;
  }

  // To add a new round
  public addLast(value: T): void {
    const node = new RoundNode<T>(value);
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      this.tail!.next = node;
      this.tail = node;
    }
  }

  /*
  To get each round index when pushing back to the db.
  Considering that the Final round will always haave
  round_num == 1, then:
  round_num = roundSLL.indexOf(mapped_round + 1);
  */
  public indexOf(value: T): number {
    let current = this.head;
    let index = 0;
    while (current) {
        if (current.data === value) return index;
        current = current.next;
        index++;
    }
    return -1;
  }

}
