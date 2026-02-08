declare module 'bcrypt' {
  function hash(password: string | Buffer, saltOrRounds: string | number): Promise<string>;
  function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  function genSalt(rounds?: number): Promise<string>;
  function genSaltSync(rounds?: number): string;
  function hashSync(password: string | Buffer, saltOrRounds: string | number): string;
  function compareSync(data: string | Buffer, encrypted: string): boolean;
  function getRounds(encrypted: string): number;
}