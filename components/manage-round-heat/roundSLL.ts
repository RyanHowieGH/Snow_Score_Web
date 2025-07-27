import roundNode from "@/components/manage-round-heat/roundNode";

export class SinglyLinkedList<roundNode> {
  private head: roundNode | null = null;
  private tail: roundNode | null = null;

  public isEmpty(): boolean {
    return this.head === null;
  }

  public clear(): void {
    this.head = this.tail = null;
  }

}
