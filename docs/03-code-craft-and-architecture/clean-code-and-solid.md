# Clean Code & SOLID Principles in Practice

> **Difficulty**: Intermediate  
> **Target Outcome**: Write maintainable, self-documenting code with clear separation of concerns.

---

## Core Principles

1. **Single Responsibility Principle (SRP)**: A module or class should have only one reason to change.
2. **Open/Closed Principle (OCP)**: Entities should be open for extension, but closed for modification.
3. **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for base types without breaking invariants.
4. **Interface Segregation Principle (ISP)**: Many client-specific interfaces are preferable to a single general-purpose interface.
5. **Dependency Inversion Principle (DIP)**: Depend upon abstractions, not concrete implementations.

---

## Practical Refactoring: Before and After

### Anti-Pattern: Mixed Concerns in Single Class
```typescript
// Violates SRP: Handles validation, database access, notification, and logging
class UserService {
  async registerUser(email: string, pass: string) {
    if (!email.includes('@')) throw new Error('Invalid email');
    
    const db = new Database();
    await db.query(`INSERT INTO users VALUES ('${email}', '${pass}')`);
    
    const mailer = new SMTPLib();
    await mailer.sendMail(email, 'Welcome!');
    
    console.log('User registered at ' + new Date());
  }
}
```

### Standard Pattern: Inverted Dependencies and Isolated Domains
```typescript
interface UserRepository {
  save(user: User): Promise<void>;
}

interface NotificationService {
  sendWelcome(email: string): Promise<void>;
}

class RegisterUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private notifier: NotificationService,
    private logger: Logger
  ) {}

  async execute(dto: RegisterUserDTO): Promise<User> {
    const user = User.create(dto);
    await this.userRepo.save(user);
    await this.notifier.sendWelcome(user.email);
    this.logger.info('User registered', { userId: user.id });
    return user;
  }
}
```

---

## Contributor Challenges
- [ ] Interface Segregation examples in Go and TypeScript.
- [ ] Cognitive complexity versus cyclomatic complexity analysis.
