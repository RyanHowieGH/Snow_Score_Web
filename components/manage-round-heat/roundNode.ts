export class roundNode<T> {
  public data: T;
  public next: roundNode<T> | null;

  constructor(
    data: T,
    next: roundNode<T> 
    | null = null) {
        this.data = data;
        this.next = next;
    }
}

// export class roundNode<T> {
//   public round_id: string;
//   public round_name: string;
//   public num_athletes: number;
//   public num_heats: number;
//   public round_num: number;
//   public division_id: number;
//   public division_name: string;
//   public next: roundNode<T> | null;

//   constructor(
//     round_id: string,
//     round_name: string,
//     num_athletes: number,
//     num_heats: number,
//     round_num: number,
//     division_id: number,
//     division_name: string,
//     next: roundNode<T> 
//     | null = null) {

//         this.round_id = round_id;
//         this.next = next;
//         this.round_name = round_name;
//         this. num_athletes = num_athletes;
//         this.num_heats = num_heats;
//         this.round_num = round_num;
//         this.division_id = division_id;
//         this.division_name = division_name;
//     }
// }