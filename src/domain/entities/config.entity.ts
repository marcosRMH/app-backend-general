

export class Config {
  constructor(
    NAME_PORTAL: string,
    private readonly CONFIG_CORREO: Object,
  ) {;
  }

  get namePortal(): string {
    return this.namePortal;
  }

  get configCorreo(): object {
    return this.CONFIG_CORREO;
  }
}
